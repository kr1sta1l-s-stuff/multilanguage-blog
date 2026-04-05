from fastapi import HTTPException, status


class UserError:
    NOT_FOUND = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found",
    )
    USERNAME_TAKEN = HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Username already taken",
    )
    ID_OR_USERNAME_REQUIRED = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Either user_id or username must be provided",
    )
    ID_AND_USERNAME_EXCLUSIVE = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only one of user_id or username must be provided",
    )
