(function (ko, handlers, unwrap, extend) {
	"use strict";
	extend(handlers, {
		href: {
			update: function (element, valueAccessor) {
				handlers.attr.update(element, function () {
					return { href: valueAccessor() };
				});
			}
		},
		src: {
			update: function (element, valueAccessor) {
				handlers.attr.update(element, function () {
					return { src: valueAccessor() };
				});
			}
		},
		hidden: {
			update: function (element, valueAccessor) {
				var value = unwrap(valueAccessor());
				handlers.visible.update(element, function () { return !value; });
			}
		},
		instantValue: {
			init: function (element, valueAccessor, allBindingsAccessor) {
				handlers.value.init(element, valueAccessor,
					ko.observable(extend(allBindingsAccessor(), {valueUpdate: 'afterkeydown'}))
					);
			},
			update: handlers.value.update
		},
		toggle: {
			init: function (element, valueAccessor) {
				var value = valueAccessor();
				ko.applyBindingsToNode(element, {
					click: function () {
						value(!value());
					}
				});
			}
		},
		currency: {
			symbol: ko.observable('$'),
			numberToCurrency: function (value, symbol) {
				return symbol + value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
			},
			update: function (element, valueAccessor, allBindingsAccessor) {
				return handlers.text.update(element, function () {
					var value = +(unwrap(valueAccessor()) || 0),
					symbol = unwrap(allBindingsAccessor().symbol === undefined
						? allBindingsAccessor().symbol
						: handlers.currency.symbol);
					return handlers.currency.numberToCurrency(value, symbol);
				});
			}
		},
		stopBinding: {
			init: function () {
				return { controlsDescendantBindings: true };
			}
		},
		toJSON: {
			update: function (element, valueAccessor) {
				return handlers.text.update(element, function () {
					return ko.toJSON(valueAccessor(), null, 2);
				});
			}
		},
		enter : {
  init: function (element, valueAccessor, allBindings, data, context) {
    var wrapper = function (data, event) {
      if (event.keyCode === 13) {
        valueAccessor().call(this, data, event);
      }
    };
    ko.applyBindingsToNode(element, { event: { keyup: wrapper } }, context);
  }
},
		date : {
			update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var value = valueAccessor();
				var allBindings = allBindingsAccessor();
				var valueUnwrapped = ko.utils.unwrapObservable(value);
				
        // Date formats: http://momentjs.com/docs/#/displaying/format/
        var pattern = allBindings.format || 'DD/MM/YYYY';
        
        var output = "-";
        if (valueUnwrapped !== null && valueUnwrapped !== undefined && valueUnwrapped.length > 0) {
        	output = moment(valueUnwrapped).format(pattern);
        }
        
        if ($(element).is("input") === true) {
        	$(element).val(output);
        } else {
        	$(element).text(output);
        }
    }
},
timeAgo: {
	dateToTimeAgo: function (dt) {
		var secs = (((new Date()).getTime() - dt.getTime()) / 1000),
		days = Math.floor(secs / 86400);
		return days === 0 && (
			secs < 60 && "just now" ||
			secs < 120 && "a minute ago" ||
			secs < 3600 && Math.floor(secs / 60) + " minutes ago" ||
			secs < 7200 && "an hour ago" ||
			secs < 86400 && Math.floor(secs / 3600) + " hours ago") ||
		days === 1 && "yesterday" ||
		days < 31 && days + " days ago" ||
		days < 60 && "one month ago" ||
		days < 365 && Math.ceil(days / 30) + " months ago" ||
		days < 730 && "one year ago" ||
		Math.ceil(days / 365) + " years ago";
	},
	update: function (element, valueAccessor) {
		var val = unwrap(valueAccessor()),
date = new Date(val), // WARNING: this is not compatibile with IE8
timeAgo = handlers.timeAgo.toTimeAgo(date);
return handlers.html.update(element, function () {
	return '<time datetime="' + encodeURIComponent(val) + '">' + timeAgo + '</time>';
});
}
}
});

ko.virtualElements.allowedBindings.stopBinding = true;
}(ko, ko.bindingHandlers, ko.utils.unwrapObservable, ko.utils.extend));