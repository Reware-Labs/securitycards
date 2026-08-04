# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: access control

## access control

### Scope Resource Lookups to Authenticated User Associations

**Use when**

When updating, editing, or deleting user-owned resources in controller actions to enforce ownership checks and prevent IDOR vulnerabilities.

**Secure rules**

**Rule 1: Scope Active Record lookups through the current user's association instead of querying models globally.**

Query models using associations tied to the authenticated user, such as `Current.user.wishlists.find(params[:id])`, rather than performing top-level queries with `Model.find(params[:id])`. This ensures that unprivileged users cannot access, modify, or delete resources belonging to other users.

```ruby
class WishlistsController < ApplicationController
  before_action :set_wishlist, only: %i[ edit update destroy ]

  private
    def set_wishlist
      @wishlist = Current.user.wishlists.find(params[:id])
    end
end
```
