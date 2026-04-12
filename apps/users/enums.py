from enum import Enum


class UserRights(Enum):
    CAN_PUBLISH = 1
    CAN_COMMENT = 1 << 1
    CAN_MODERATE_COMMENTS = 1 << 2
