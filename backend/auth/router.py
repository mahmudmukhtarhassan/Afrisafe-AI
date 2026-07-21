@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    existing = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_user = User(
        fullname=user.fullname,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()

    return {
        "message":"Registration successful"
    }
@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        user.password,
        existing.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        {
            "sub": existing.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
