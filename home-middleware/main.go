package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/grandcat/zeroconf"
)

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func main() {
	// 1. MQTT Connection (Local Mosquitto)
	mqttBrokerURL := getEnv("HOMECHAIN_MQTT_BROKER", "tcp://localhost:1883")
	opts := mqtt.NewClientOptions().AddBroker(mqttBrokerURL)
	opts.SetClientID("Go_Home_Middleware")
	mqttClient := mqtt.NewClient(opts)
	if token := mqttClient.Connect(); token.Wait() && token.Error() != nil {
		log.Fatal("MQTT Connection Error:", token.Error())
	}
	fmt.Printf("✅ MQTT: Connected to broker %s.\n", mqttBrokerURL)

	// 2. Blockchain Connection (Anvil/Hardhat)
	wsURL := getEnv("HOMECHAIN_WS_URL", "ws://127.0.0.1:8545")
	client, err := ethclient.Dial(wsURL)
	if err != nil {
		log.Fatal("Blockchain Connection Error:", err)
	}

	contractHex := getEnv("HOMECHAIN_CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
	if !common.IsHexAddress(contractHex) {
		log.Fatalf("Invalid HOMECHAIN_CONTRACT_ADDRESS: %s", contractHex)
	}

	contractAddr := common.HexToAddress(contractHex)
	instance, err := NewAdvancedHomeAutomation(contractAddr, client)
	if err != nil {
		log.Fatal("Contract Instance Error:", err)
	}

	fmt.Printf("⛓️  Watching contract %s via %s\n", contractAddr.Hex(), wsURL)

	// 3. mDNS Discovery (Finding the ESP32)
	go func() {
		resolver, _ := zeroconf.NewResolver(nil)
		for {
			entries := make(chan *zeroconf.ServiceEntry)
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
			
			err := resolver.Browse(ctx, "_homeautomation._tcp", "local.", entries)
			if err == nil {
				go func() {
					for entry := range entries {
						fmt.Printf("[DISCOVERY] 🛰️ ESP32 Found: %s | IP: %v\n", entry.Instance, entry.AddrIPv4)
					}
				}()
			}
			<-ctx.Done()
			cancel()
			time.Sleep(30 * time.Second) // Re-scan every 30s
		}
	}()

	// 4. Watch Events
	// StateChanged: device control commands
	sink := make(chan *AdvancedHomeAutomationStateChanged)
	sub, err := instance.WatchStateChanged(nil, sink)
	if err != nil {
		log.Fatal("StateChanged Subscription Error:", err)
	}

	// RoomRemoved: room deletion notifications
	roomRemovedSink := make(chan *AdvancedHomeAutomationRoomRemoved)
	roomRemovedSub, err := instance.WatchRoomRemoved(nil, roomRemovedSink, nil)
	if err != nil {
		log.Fatal("RoomRemoved Subscription Error:", err)
	}

	// DeviceRemoved: device deletion notifications
	deviceRemovedSink := make(chan *AdvancedHomeAutomationDeviceRemoved)
	deviceRemovedSub, err := instance.WatchDeviceRemoved(nil, deviceRemovedSink, nil, nil)
	if err != nil {
		log.Fatal("DeviceRemoved Subscription Error:", err)
	}

	fmt.Println("✅ System Online: Watching for Authenticated Commands...")

	for {
		select {
		case err := <-sub.Err():
			fmt.Printf("⚠️  Blockchain Sync Error (StateChanged): %v\n", err)
			time.Sleep(2 * time.Second)
			continue

		case err := <-roomRemovedSub.Err():
			fmt.Printf("⚠️  Blockchain Sync Error (RoomRemoved): %v\n", err)
			time.Sleep(2 * time.Second)
			continue

		case err := <-deviceRemovedSub.Err():
			fmt.Printf("⚠️  Blockchain Sync Error (DeviceRemoved): %v\n", err)
			time.Sleep(2 * time.Second)
			continue

		case event := <-sink:
			rId := event.RoomId.Uint64()
			dId := event.DeviceId.Uint64()
			val := event.NewValue.Uint64()

			fmt.Printf("\n[BLOCKCHAIN] 🔔 StateChanged!")

			if info, err := instance.GetDeviceInfo(nil, event.RoomId, event.DeviceId); err == nil {
				deviceTypes := []string{"OnOff", "Fan", "Dimmer", "RGB"}
				typeName := "Unknown"
				if int(info.DType) < len(deviceTypes) {
					typeName = deviceTypes[info.DType]
				}
				fmt.Printf("\n📍 Room: %d | 💡 Device: %d | Name: \"%s\" | Type: %s | Pin: %d | ⚡ Value: %d\n",
					rId, dId, info.Name, typeName, info.PinNo.Uint64(), val)
			} else {
				fmt.Printf("\n📍 Room: %d | 💡 Device: %d | ⚡ Value: %d\n", rId, dId, val)
			}

			topic := fmt.Sprintf("home/room%d/device%d", rId, dId)
			payload := fmt.Sprintf("%d", val)
			mqttClient.Publish(topic, 1, false, payload)
			fmt.Printf("📡 MQTT -> Published '%s' to '%s'\n", payload, topic)

		case event := <-roomRemovedSink:
			rId := event.RoomId.Uint64()

			fmt.Printf("\n[BLOCKCHAIN] 🗑️  RoomRemoved! Room: %d\n", rId)

			topic := fmt.Sprintf("home/room%d/removed", rId)
			mqttClient.Publish(topic, 1, true, "1")
			fmt.Printf("📡 MQTT -> Published removed signal to '%s'\n", topic)

		case event := <-deviceRemovedSink:
			rId := event.RoomId.Uint64()
			dId := event.DeviceId.Uint64()

			fmt.Printf("\n[BLOCKCHAIN] 🗑️  DeviceRemoved! Room: %d | Device: %d\n", rId, dId)

			topic := fmt.Sprintf("home/room%d/device%d/removed", rId, dId)
			mqttClient.Publish(topic, 1, true, "1")
			fmt.Printf("📡 MQTT -> Published removed signal to '%s'\n", topic)
		}
	}
}