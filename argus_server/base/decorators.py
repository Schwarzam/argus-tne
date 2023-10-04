from functools import wraps
from django.http import JsonResponse

def require_keys(*required_keys):
    """
    Decorator to ensure that the request contains the specified keys.

    Usage:
    @require_keys('key1', 'key2', ...)
    def my_view(request):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Assuming you're dealing with a JSON payload
            print(request.data)
            try:
                payload = request.json() if hasattr(request, 'json') else request.data
            except ValueError:
                return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
            
            missing_keys = [key for key in required_keys if key not in payload]

            if missing_keys:
                return JsonResponse({'error': f'Missing keys: {", ".join(missing_keys)}'}, status=400)

            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator