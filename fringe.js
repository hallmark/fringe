//
//  Fringe.js 0.0.0.1-ultra-pre-alpha
//
//  (c) 2011 Mark Ture <mark.ture@gmail.com>
//  Fringe may be freely distributed under the MIT license.
//  For all details and documentation:
//  http://github.com/hallmark/fringe
//

/**
 * config {}:
 *   visible: boolean - whether to display the Fringe panel
 *   options []:
 *     name
 *     labels[] 0: falseLabel, 1: trueLabel
 *     type
 *     defaultValue
 */
var $fr = {};

(function() {

  /*
   * PRIVATE
   */
  var _fringe = this,
      _config = {},
      _configMap = {},
      _panel = null,
      _deferredOpts = [],
      _libProxy = null, /* handle jQuery, Prototype, and maybe YUI */
      _handleOptionClick, // allow function to be captured in closure for onclick handler
      _defStyles;
  
  _defStyles =
    '.fringe-panel { position: fixed; top: 10px; right: 10px; width: 170px; height: 50px; z-index: 100; background-color: #444; border: 3px solid #222; padding-top: 2px; }' +
    '.fringe-panel a:link,.fringe-panel a:hover,.fringe-panel a:visited { color: #DDD; text-decoration: none; }' +
    '.fringe-panel a:hover { text-decoration: underline; }' +
    '.fringe-panel p { margin: 8px 11px; }';
  
  _handleOptionClick = function(el, opt) {
    opt.value = !(opt.value);
    var labelIdx = (opt.value) ? 1 : 0;
    //$(el).text(opt.labels[labelIdx]);
    el.innerHTML = opt.labels[labelIdx];
    
    if (opt.onActivate !== undefined) {
      opt.onActivate.call(opt, opt.value);
    }
  };
  
  if (true /* detect jQuery */)
  {
    _libProxy = (function() {
      return {
        build: function() {
          if (arguments.length > 0) {
            arguments[0] = '<'+arguments[0]+'/>';
          }
          return $.apply(null, arguments)[0];
        }
      };
    })();
  }
  else if (false /* detect Prototype */)
  {
    _libProxy = (function() {
      return {
        build: function() {
          return new Element(null, arguments);
        }
      };
    })();
  }
  
  /* Technique from YUI StyleSheet */
  function _addStyles(cssText) {
    var head,
        node;
    
    node = document.createElement('style');
    node.type = 'text/css';
    if (node.styleSheet) {
      node.styleSheet.cssText = cssText;
    } else {
      node.appendChild( document.createTextNode(cssText) );
    }
    head = (node.ownerDocument || document).getElementsByTagName('head')[0];
    head.appendChild(node);
  }

  function _createPanel() {
    var allOpts = _config.options.concat(_deferredOpts);
    
    // create the container panel for the buttons!
    _addStyles(_defStyles)
    //_panel = _libProxy.build('div', {'class':'fringe-panel', 'style':'position:fixed; top:10px; right:10px; width:170px; height:50px; z-index: 100; background-color:#CCbC7C'});
    _panel = document.createElement('div');
    _panel.className = 'fringe-panel';
    document.body.appendChild(_panel);

    for ( var i=0; i<allOpts.length; i++ ) {
      var anOpt = allOpts[i];
      _fringe.addOption(anOpt);
    }
  }
  
  
  /*
   * PUBLIC FUNCTIONS
   */
  this.initialize = function(config) {
    _config = config;
    _config.options = _config.options || [];
    
    // create (name->option) map and set value to default
    for ( var i=0; i<_config.options.length; i++ ) {
      var anOpt = _config.options[i];
      anOpt['value'] = anOpt.defaultValue;
      _configMap[anOpt.name] = anOpt;
      anOpt._inited = true;
    }
  };
  
  this.render = function() {
    if (_config.visible === true) {
      _createPanel();
    }
  }
  
  this.addOption = function(anOpt) {
    if (!anOpt._inited) {
      anOpt['value'] = anOpt.defaultValue;
      _configMap[anOpt.name] = anOpt;
      anOpt._inited = true;
    }
    if (_panel === null) {
      _deferredOpts.push(anOpt);
      return;
    }
    var btn = _libProxy.build('a', {
      'href':'#',
      'class':'button',
      text: anOpt.labels[((anOpt.value) ? 1 : 0)]
    });
    /*
    $(btn).click({opt: anOpt}, function(event) {
      _handleOptionClick(this, event.data.opt);
      return false;
    });*/
    btn.onclick = function(event) {
      _handleOptionClick(this, anOpt);
      return false;
    };
    var cont = document.createElement('p');
    cont.appendChild(btn);
    _panel.appendChild(cont);
  }
  
  this.getValue = function(name) {
    var opt = this.getOptionByName(name);

    if ( opt === undefined ) {
      return undefined;
    }
    
    return opt.value;
  };
  
  this.getOptionByName = function(name) {
    return _configMap[name];
  };
  
}).apply($fr);
