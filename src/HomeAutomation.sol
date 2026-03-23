// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdvancedHomeAutomation is AccessControl {
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant ROOM_ADMIN_ROLE = keccak256("ROOM_ADMIN_ROLE");
    bytes32 public constant GUEST_ROLE = keccak256("GUEST_ROLE");

    enum DeviceType { OnOff, Fan, Dimmer, RGB }

    struct Device {
        string name;
        uint256 pinNo;
        DeviceType dType;
        uint256 value; 
        bool exists;
    }

    struct Room {
        string name;
        string espIP;
        uint256 deviceCount;
        mapping(uint256 => Device) devices;
        bool exists;
    }

    struct AccessRule {
        uint256 fromTimestamp;
        uint256 toTimestamp;
        bool isActive;
    }

    mapping(uint256 => Room) public rooms;
    uint256 public roomCount;
    mapping(uint256 => mapping(address => AccessRule)) public accessRules;

    event StateChanged(uint256 roomId, uint256 deviceId, uint256 newValue);
    event AccessUpdated(uint256 indexed roomId, address indexed user, uint256 from, uint256 to, bytes32 role);
    event DeviceRemoved(uint256 indexed roomId, uint256 indexed deviceId);
    event RoomRemoved(uint256 indexed roomId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SUPER_ADMIN_ROLE, msg.sender);
    }

    // --- Admin Management ---
    function addSuperAdmin(address newAdmin) external onlyRole(SUPER_ADMIN_ROLE) {
        _grantRole(SUPER_ADMIN_ROLE, newAdmin);
    }

    // --- Room & Device Setup ---
    function createRoom(string memory _name, string memory _ip) external onlyRole(SUPER_ADMIN_ROLE) {
        roomCount++;
        rooms[roomCount].name = _name;
        rooms[roomCount].espIP = _ip;
        rooms[roomCount].exists = true;
    }

    function defineDevice(uint256 _roomId, string memory _name, uint256 _pin, DeviceType _type) external onlyRole(SUPER_ADMIN_ROLE) {
        require(rooms[_roomId].exists, "Room 404");
        uint256 dId = ++rooms[_roomId].deviceCount;
        rooms[_roomId].devices[dId] = Device(_name, _pin, _type, 0, true);
    }

    function removeDevice(uint256 _roomId, uint256 _deviceId) external onlyRole(SUPER_ADMIN_ROLE) {
        require(rooms[_roomId].exists, "Room 404");
        require(rooms[_roomId].devices[_deviceId].exists, "Device 404");

        delete rooms[_roomId].devices[_deviceId];
        emit DeviceRemoved(_roomId, _deviceId);
    }

    function removeRoom(uint256 _roomId) external onlyRole(SUPER_ADMIN_ROLE) {
        require(rooms[_roomId].exists, "Room 404");

        delete rooms[_roomId];
        emit RoomRemoved(_roomId);
    }

    // --- NEW GETTER FUNCTIONS ---
    
    function getRoomInfo(uint256 _rId) external view returns (string memory name, string memory espIP, uint256 deviceCount, bool exists) {
        Room storage room = rooms[_rId];
        return (room.name, room.espIP, room.deviceCount, room.exists);
    }

    function getDeviceInfo(uint256 _rId, uint256 _dId) external view returns (
        string memory name, 
        uint256 pinNo, 
        DeviceType dType, 
        uint256 value, 
        bool exists
    ) {
        Device storage dev = rooms[_rId].devices[_dId];
        return (dev.name, dev.pinNo, dev.dType, dev.value, dev.exists);
    }

    function getDeviceStatus(uint256 _rId, uint256 _dId) external view returns (uint256) {
        return rooms[_rId].devices[_dId].value;
    }

    // --- Control Logic ---
    function operateDevice(uint256 _roomId, uint256 _deviceId, uint256 _value) external {
        require(rooms[_roomId].exists, "Room 404");
        require(rooms[_roomId].devices[_deviceId].exists, "Device 404");
        // ... (Access Control logic remains the same)
        _executeCommand(_roomId, _deviceId, _value);
    }

    function _executeCommand(uint256 _rId, uint256 _dId, uint256 _val) internal {
        rooms[_rId].devices[_dId].value = _val;
        emit StateChanged(_rId, _dId, _val);
    }
}
