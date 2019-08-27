export enum Command {
    NOP = 0x00,
    LIST_SERVICES = 0x04,
    LIST_IDENTITY = 0x63,
    LIST_INTERFACES = 0x64,
    REGISTER_SESSION = 0x65, // Begin Session Command
    UNREGISTER_SESSION = 0x66, // Close Session Command
    SEND_RR_DATA = 0x6f, // Send Unconnected Data Command
    SEND_UNIT_DATA = 0x70, // Send Connnected Data Command
    INDICATE_STATUS = 0x72,
    CANCEL = 0x73
}