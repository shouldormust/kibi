require('jquery');
require('node_modules/angular/angular');
module.exports = window.angular;

require('node_modules/angular-elastic/elastic');
// kibi: for the session
require('node_modules/angular-cookies/angular-cookies');

require('ui/modules').get('kibana', ['monospaced.elastic', 'ngCookies']);
