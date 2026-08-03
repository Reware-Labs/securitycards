# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: access control

## access control

### Enforce View-Level Permissions and Authorization Checks

**Use when**

Protecting function-based views or class-based views to ensure only authenticated and authorized users can access specific functionality or resources.

**Secure rules**

**Rule 1: Pass an iterable of permission codenames to the permission_required decorator when a view requires multiple permissions.**

Use `permission_required` from `django.contrib.auth.decorators` and provide a list or iterable of required permission codenames to prevent unauthorized access to privileged functionality.

```python
from django.contrib.auth.decorators import permission_required

@permission_required(["polls.add_choice", "polls.change_choice"])
def edit_choice_view(request):
    # View logic requiring both permissions
    pass
```

**Rule 2: Inherit from authentication and permission mixins when securing class-based views.**

Use `LoginRequiredMixin`, `PermissionRequiredMixin`, or `UserPassesTestMixin` from `django.contrib.auth.mixins` to enforce authentication and access control rules before executing class-based view logic.

```python
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import View

class ProtectedView(LoginRequiredMixin, PermissionRequiredMixin, View):
    permission_required = 'polls.can_vote'
    permission_denied_message = 'You do not have permission to access this page.'
    raise_exception = True
```

**Rule 3: Set raise_exception=True when using permission_required to return an HTTP 403 Forbidden response.**

Configure `permission_required` with `raise_exception=True` so that authenticated users lacking required permissions receive an HTTP 403 Forbidden exception instead of being redirected to a login page.

```python
from django.contrib.auth.decorators import permission_required
from django.utils.decorators import method_decorator

@permission_required('auth.add_user', raise_exception=True)
def add_user_view(request):
    return HttpResponse('User creation view')
```


### Restrict Data Access and Form Fields by Request User

**Use when**

Rendering admin forms or relational choices to ensure users only view or interact with authorized records and tenant data.

**Secure rules**

**Rule 1: Restrict related model choices in admin forms based on the active request user.**

Override `formfield_for_foreignkey` in your `ModelAdmin` class to filter querysets using `request.user` and prevent users from selecting records belonging to other users or tenants.

```python
class CarTireAdmin(admin.ModelAdmin):
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "car" and not request.user.is_superuser:
            kwargs["queryset"] = Car.objects.filter(owner=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
```
