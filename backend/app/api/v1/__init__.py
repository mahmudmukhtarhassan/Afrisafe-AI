# Package initializer for API v1
# Ensures the package is recognized and exposes api_router for imports.
from .router import api_router

__all__ = ["api_router"]
