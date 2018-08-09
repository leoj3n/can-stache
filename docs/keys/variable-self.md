@typedef {String} can-stache/keys/variable/self *self
@parent can-stache/keys
@description Used to reference the current template and recursively render it

@deprecated {4.0} `{{>*self}}` is deprecated in favor of [can-stache/keys/scope/scope.view `{{>scope.view}}`]

@signature `{{>*self}}`

The entirety of the current template is always stored as a [can-stache.tags.named-partial named partial] `*self`

```html
<div>
	{{>*self}}
</div>
```

@body

## Use

This can be used to recursively render a template given a stop condition.
Note that we use a key expression to set local scope. Also note it is
a dot slash on the child key expression.
The dot slash prevents walking up the scope. See [can-stache.tags.named-partial#TooMuchRecursion Too Much Recursion] for more details.

```js
var grandpaWorm = new DefineMap({
	name: "Earthworm Jim",
	child: {
		name: "Grey Worm",
		child: {
			name: "MyDoom"
		}
	}
});

var renderer = stache(`
	<span>{{name}}</span>
	{{#./child}}
		<div>
			{{>*self}}
		</div>
	{{/child}}
`);

var view = renderer(grandpaWorm);
```

The view variable will be the document fragment:

```html
<span>Earthworm Jim</span>
<div>
	<span>Grey Worm</span>
	<div>
		<span>MyDoom</span>
	</div>
</div>
```

A template variable can be passed in

```js
var grandpaWorm = new DefineMap({
	child: {
		name: "Earthworm Jim",
		hasArms: false,
		child: {
			name: "Grey Worm",
			child: {
				name: "MyDoom"
			}
		}
	}
});

var renderer = stache(`
	<p>{{name}}</p>
	<p>{{hasArms}}</p>
	{{#./child}}
		<div>
			{{>*self}}
		</div>
	{{/child}}
`);

var view = renderer(grandpaWorm);
```

The view variable will be the document fragment:

```html
<p>Earthworm Jim</p>
<p>false</p>
<div>
	<p>Grey Worm</p>
	<p>false</p>
	<div>
		<p>MyDoom</p>
		<p>false</p>
	</div>
</div>
```

For a more detailed explanation of using partials recursively, see
[can-stache.tags.named-partial#TooMuchRecursion Too Much Recursion].