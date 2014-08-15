framework-admin
===============

Admin module for Idealist Framework

## Admin properties for models
	
- admin_type:
	Type of field for admin
	String
	Default: text
	Available Types:
	- text
	- textarea
	- checkbox
	- datepicker
	- enum
	- password
	- json
	- html
	Optional
- admin_enum:
	Key-value list of enumeration values when admin_type = `enum`.
	Array
- admin_hidden_property
	Hides the property by default when browsing models in the admin dashboard.
	Boolean
	Default: false
	Optional
- admin_html:
	An HTML string that will have values from the model injected. Only used in the admin dashboard.
	String
	Example: <a href="/users/profile/{uid}">{username}</a>
	Optional
- admin_no_sort:
	Prevents the column from being sortable in the admin dashboard
	Boolean
	Default: false
	Optional
- admin_no_wrap:
	Prevents the column from wrapping in the admin dashboard
	Boolean
	Default: false
	Optional
- admin_truncate:
	Prevents the column from truncating values in the admin dashboard
	Boolean
	Default: true
	Optional