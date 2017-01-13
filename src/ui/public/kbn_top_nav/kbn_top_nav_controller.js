import { capitalize, isArray, isFunction } from 'lodash';

import chrome from 'ui/chrome';
import filterTemplate from 'ui/chrome/config/filter.html';
import intervalTemplate from 'ui/chrome/config/interval.html';

// kibi: added location service
export default function ($compile, $location) {
  return class KbnTopNavController {
    constructor(opts = []) {
      if (opts instanceof KbnTopNavController) {
        return opts;
      }

      this.opts = [];
      this.menuItems = [];
      this.currentKey = null;
      this.templates = {
        interval: intervalTemplate,
        filter: filterTemplate,
      };

      // kibi: navbar extensions can pass controllers
      this.controllers = [];

      this.addItems(opts);
    }

    isVisible() {
      return chrome.getVisible();
    }

    addItems(rawOpts) {
      if (!isArray(rawOpts)) rawOpts = [rawOpts];

      rawOpts.forEach((rawOpt) => {
        const opt = this._applyOptDefault(rawOpt);
        if (!opt.key) throw new TypeError('KbnTopNav: menu items must have a key');
        this.opts.push(opt);
        // kibi: pass the current path to hide or not the button
        if (!opt.hideButton($location.path())) this.menuItems.push(opt);
        if (opt.template) this.templates[opt.key] = opt.template;
        // kibi: pass the controller
        if (opt.controller) this.controllers[opt.key] = opt.controller;
      });
    }

    // change the current key and rerender
    setCurrent(key) {
      if (key && !this.templates.hasOwnProperty(key)) {
        throw new TypeError(`KbnTopNav: unknown template key "${key}"`);
      }

      this.currentKey = key || null;
      this._render();
    }

    // little usability helpers
    getCurrent() { return this.currentKey; }
    isCurrent(key) { return this.getCurrent() === key; }
    open(key) { this.setCurrent(key); }
    close(key) { (!key || this.isCurrent(key)) && this.setCurrent(null); }
    toggle(key) { this.setCurrent(this.isCurrent(key) ? null : key); }
    handleClick(menuItem) {
      if (menuItem.disableButton()) {
        return false;
      }
      menuItem.run(menuItem, this);
    }
    // apply the defaults to individual options
    _applyOptDefault(opt = {}) {
      const defaultedOpt = Object.assign({
        label: capitalize(opt.key),
        hasFunction: !!opt.run,
        description: opt.run ? opt.key : `Toggle ${opt.key} view`,
        run: (item) => this.toggle(item.key)
      }, opt);

      defaultedOpt.hideButton = isFunction(opt.hideButton) ? opt.hideButton : () => !!opt.hideButton;
      defaultedOpt.disableButton = isFunction(opt.disableButton) ? opt.disableButton : () => !!opt.disableButton;
      defaultedOpt.tooltip = isFunction(opt.tooltip) ? opt.tooltip : () => opt.tooltip;

      return defaultedOpt;
    }

    // enable actual rendering
    _link($scope, $element) {
      this.$scope = $scope;
      this.$element = $element;
      this._render();
    }

    // render the current template to the $element if possible
    // function is idempotent
    _render() {
      const { $scope, $element, rendered, currentKey } = this;
      const templateToRender = currentKey && this.templates[currentKey];

      if (rendered) {
        if (rendered.key !== currentKey) {
          // we have an invalid render, clear it
          rendered.$childScope.$destroy();
          rendered.$el.remove();
          this.rendered = null;
        } else {
          // our previous render is still valid, keep it
          return;
        }
      }

      if (!templateToRender || !$scope || !$element) {
        // we either have nothing to render, or we can't render
        return;
      }

      const $childScope = $scope.$new();
      // kibi: pass the controller to the scope
      if (this.controllers[currentKey]) {
        $childScope.controller = this.controllers[currentKey];
      }
      const $el = $element.find('#template_wrapper').html(templateToRender).contents();
      $compile($el)($childScope);

      this.rendered = { $childScope, $el, key: currentKey };
    }
  };
}
