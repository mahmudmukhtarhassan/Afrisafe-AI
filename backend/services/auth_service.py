from app.core.supabase import supabase


async def register_user(full_name: str, email: str, password: str):

    response = supabase.auth.sign_up(
        {
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name
                }
            }
        }
    )

    return response


async def login_user(email: str, password: str):

    response = supabase.auth.sign_in_with_password(
        {
            "email": email,
            "password": password
        }
    )

    return response


async def logout_user(jwt: str):

    supabase.auth.sign_out(jwt)
