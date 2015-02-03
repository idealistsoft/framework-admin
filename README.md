admin
===============

[![Coverage Status](https://coveralls.io/repos/infusephp/admin/badge.png)](https://coveralls.io/r/infusephp/admin)
[![Latest Stable Version](https://poser.pugx.org/infuse/admin/v/stable.png)](https://packagist.org/packages/infuse/admin)
[![Total Downloads](https://poser.pugx.org/infuse/admin/downloads.png)](https://packagist.org/packages/infuse/admin)
[![HHVM Status](http://hhvm.h4cc.de/badge/infuse/admin.svg)](http://hhvm.h4cc.de/package/infuse/admin)

Admin module for Infuse Framework

## Installation

1. Add the composer package in the require section of your app's `composer.json` and run `composer update`

2. Copy the CSS and JS files into the `public` directory. If you use the minified versions, be sure they are renamed to `css/admin.css` and `js/admin.js`.

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