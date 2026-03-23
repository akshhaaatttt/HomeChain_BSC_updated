/**
 * Pin Encoding Strategy for Multi-Pin Devices
 * 
 * The smart contract's `defineDevice` function accepts a single `pinNo` parameter (uint256).
 * For devices with multiple pins (Fan, RGB), we pack multiple pin values into this single parameter.
 * 
 * The middleware will unpack these values when processing StateChanged events.
 * 
 * Based on ESP32 Hardware Pin Configuration:
 * - ON/OFF: 1 pin (RELAY_SW1=33 or RELAY_SW2=18)
 * - FAN: 3 pins (RELAY_FAN_S1=25, RELAY_FAN_S2=26, RELAY_FAN_S3=32)
 * - RGB: 4 pins (RELAY_RGB_SW=5, PIN_RED=27, PIN_GREEN=14, PIN_BLUE=12)
 */

export enum DeviceTypeEnum {
  OnOff = 0,
  Fan = 1,
  Dimmer = 2,
  RGB = 3,
}

/**
 * Pin packing for Fan devices (3 pins - one per speed level)
 * 
 * ESP32 Control Logic:
 * - All pins start HIGH (relay off)
 * - Pull one pin LOW based on desired speed
 * - Value 0: All HIGH (OFF)
 * - Value 1: S1 LOW, S2 HIGH, S3 HIGH (LOW speed - pin 25)
 * - Value 2: S1 HIGH, S2 LOW, S3 HIGH (MEDIUM speed - pin 26)
 * - Value 3: S1 HIGH, S2 HIGH, S3 LOW (HIGH speed - pin 32)
 * 
 * Packing format: (slow) | (medium << 8) | (fast << 16)
 * Each pin occupies 8 bits (0-255)
 * 
 * @example
 * packFanPins(25, 26, 32) returns packed value
 * unpackFanPins(packed) returns { slow: 25, medium: 26, fast: 32 }
 */
export function packFanPins(slow: number, medium: number, fast: number): number {
  return (slow & 0xFF) | ((medium & 0xFF) << 8) | ((fast & 0xFF) << 16);
}

export function unpackFanPins(packed: number): { slow: number; medium: number; fast: number } {
  return {
    slow: packed & 0xFF,
    medium: (packed >> 8) & 0xFF,
    fast: (packed >> 16) & 0xFF,
  };
}

/**
 * Pin packing for RGB devices (3 color pins + 1 relay pin)
 * 
 * ESP32 Control Logic:
 * - RELAY_RGB_SW (pin 5): Controls ground - LOW=ON, HIGH=OFF
 * - PIN_RED, PIN_GREEN, PIN_BLUE: PWM control (0-255)
 * - Value 0: Relay OFF (HIGH), all colors 0 (OFF)
 * - Value 1: Relay ON (LOW), R=255, G=0, B=0 (RED)
 * - Value 2: Relay ON (LOW), R=0, G=255, B=0 (GREEN)
 * - Value 3: Relay ON (LOW), R=0, G=0, B=255 (BLUE)
 * - Value 4: Relay ON (LOW), R=255, G=255, B=255 (WHITE)
 * 
 * Packing format: (red) | (green << 8) | (blue << 16) | (relay << 24)
 * Each pin occupies 8 bits (0-255)
 * 
 * @example
 * packRGBPins(27, 14, 12, 5) returns packed value
 * unpackRGBPins(packed) returns { red: 27, green: 14, blue: 12, relay: 5 }
 */
export function packRGBPins(red: number, green: number, blue: number, relay: number): number {
  return (red & 0xFF) | ((green & 0xFF) << 8) | ((blue & 0xFF) << 16) | ((relay & 0xFF) << 24);
}

export function unpackRGBPins(packed: number): { red: number; green: number; blue: number; relay: number } {
  return {
    red: packed & 0xFF,
    green: (packed >> 8) & 0xFF,
    blue: (packed >> 16) & 0xFF,
    relay: (packed >> 24) & 0xFF,
  };
}

/**
 * ESP32 Pin Definitions (Reference)
 * 
 * On/Off Switch (1 pin - binary control):
 * - RELAY_SW1 = 33
 * - RELAY_SW2 = 18
 * - Control: LOW=ON, HIGH=OFF
 * 
 * Fan Control (3 pins - one per speed level):
 * - RELAY_FAN_S1 = 25 (Slow speed)
 * - RELAY_FAN_S2 = 26 (Medium speed)
 * - RELAY_FAN_S3 = 32 (Fast speed)
 * - Control: All HIGH by default, pull LOW based on speed
 * 
 * RGB LED (4 pins - 1 control + 3 colors):
 * - RELAY_RGB_SW = 5 (On/Off control - LOW=ON, HIGH=OFF)
 * - PIN_RED = 27 (Red LED PWM)
 * - PIN_GREEN = 14 (Green LED PWM)
 * - PIN_BLUE = 12 (Blue LED PWM)
 * - Control: PWM values 0-255
 */

/**
 * Example usage in admin form:
 * 
 * For Fan device:
 * const packedPin = packFanPins(25, 26, 32);
 * // packedPin = 0x202019 (or 2101273 in decimal)
 * // Then call: defineDevice(roomId, "Ceiling Fan", packedPin, DeviceTypeEnum.Fan)
 * 
 * For RGB device (with relay for ground control):
 * const packedPin = packRGBPins(27, 14, 12, 5);
 * // packedPin = 0x050C0E1B (or 84350491 in decimal)
 * // Relay pin (5) controls RGB ground - LOW=ON, HIGH=OFF
 * // Then call: defineDevice(roomId, "RGB Strip", packedPin, DeviceTypeEnum.RGB)
 * 
 * For On/Off device:
 * // Just use single pin directly (no packing needed)
 * // Then call: defineDevice(roomId, "Light", 33, DeviceTypeEnum.OnOff)
 */
