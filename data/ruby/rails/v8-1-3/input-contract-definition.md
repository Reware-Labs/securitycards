# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: input contract definition

## input contract definition

### Filter controller parameters with Strong Parameters and validate input contracts

**Use when**

When processing incoming HTTP request parameters, API payloads, or locale selections before passing them into model mass-assignment methods or application logic.

**Secure rules**

**Rule 1: Enforce strict parameter expectations and input schema contracts**

Always require and permit incoming HTTP request parameters using `params.expect` or `params.permit` before passing parameter hashes into Active Model mass-assignment methods. Additionally, validate unverified inputs such as locale parameters against explicit allowlists like `I18n.available_locales`.

```ruby
class PeopleController < ApplicationController
  def update
    person = Person.find(params[:id])
    person.update!(person_params)
    redirect_to person
  end

  private
    def person_params
      params.expect(person: [:name, :age])
    end
end
```
