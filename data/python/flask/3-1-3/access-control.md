# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: access control

## access control

### Enforce Resource Ownership Checks Before Modifying Application Resources

**Use when**

When building state-changing operations or resource modification routes in Flask where authenticated users perform updates or deletions on records.

**Secure rules**

**Rule 1: Verify that the authenticated user matches the resource owner or author before permitting state modifications**

Query the database for the target resource and compare its owner identifier or its access against the current user in `g.user`. If the resource does not exist, raise an HTTP 404 error using `abort(404)`, and if the user does not own the resource, raise an HTTP 403 Forbidden error using `abort(403)` to prevent unauthorized access and Insecure Direct Object Reference vulnerabilities.
