//
//  Fringe.js 0.0.0.3-super-pre-alpha
//
//  (c) 2011 Mark Ture <mark.ture@gmail.com>
//  Fringe may be freely distributed under the MIT license.
//  For all details and documentation:
//  http://github.com/hallmark/fringe
//

/**
 * config {}:
 *   visible: boolean - whether to display the Fringe panel
 *   magicString: string - string to type to show/activate the panel
 *   options []: array of option definitions, defined below
 *
 * option {}
 *   type (required)
 *   name (required): alphanumeric, no spaces or punctuation (may be used in HTML IDs..)
 *   defaultValue (required)
 *   onActivate (optional)
 *
 *   -- properties for 'boolean' option
 *   values[] (required): 0: falseLabel, 1: trueLabel
 *
 *   -- properties for 'multi' option
 *   values (required): array of possible values for option
 *
 *   -- properties for 'range' option
 *   min (default: 1)
 *   max (default: 100)
 *   step (default: 1)
 *   unitLabel (default: <empty string>)
 *   unitDecimals (default: 0)
 *   
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
      _magicString = 'ff',
      _nextMagicMatch = 0,
      _panelIntendedVisible,
      _fadeTimer,
      _fadeOpacityIter = 5,  // 0 => "opacity: 0", _ANIM_STEPS => "opacity: 1.0"
      _ANIM_STEPS = 7,
      _ANIM_DURATION = 90,
      _handleOptionClick, // allow function to be captured in closure for onclick handler
      _handleKeys,
      _defStyles;
  
  _defStyles =
    '.fringe-panel { font-size: 12px; position: fixed; top: 10px; right: 10px; z-index: 100; background-color: #444; border: 3px solid #222; padding-top: 2px; }' +
    '.fringe-panel a:link,.fringe-panel a:hover,.fringe-panel a:visited { font-size: 12px; color: #DDD; text-decoration: none; }' +
    '.fringe-panel a:hover { text-decoration: underline; }' +
    '.fringe-panel p { font-size: 12px; margin: 8px 11px; color: #DDD; }' +
    '.fringe-panel p input { height: 12px; }';
  
  _handleOptionClick = function(el, opt, newValue) {
    if (opt.type === 'boolean') {
      opt.value = !(opt.value);
      var labelIdx = (opt.value) ? 1 : 0;
      el.innerHTML = opt.values[labelIdx];
    } else if (opt.type === 'multi') {
      opt.value = newValue;
    } else if (opt.type === 'range') {
      opt.value = newValue;
    }
    
    if (opt.onActivate !== undefined) {
      opt.onActivate.call(opt, opt.value);
    }
  };
  
  _handleKeys = function(e) {
    var char,
        evt = (e) ? e : window.event;
    char = (evt.charCode) ? evt.charCode : evt.keyCode;
    if (char > 31 && char < 256) {
      if (char === _magicString.toUpperCase().charCodeAt(_nextMagicMatch)) {
        _nextMagicMatch++;
        if (_nextMagicMatch === _magicString.length) {
          _fringe.togglePanel();
          _nextMagicMatch = 0;
        }
      }
      else {
        _nextMagicMatch = 0;
      }
    }
  };
  
  /* Technique from YUI StyleSheet */
  function _addStylesToPage(cssText) {
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
    var divEl,
        allOpts = _config.options.concat(_deferredOpts);
    _panelIntendedVisible = (_config.visible === true);

    _addStylesToPage(_defStyles);
    
    // create the container panel for the buttons!
    _panel = document.createElement('div');
    _panel.className = 'fringe-panel';
    if (_config.visible !== true) {
      _panel.style.display = 'none';
      _fadeOpacityIter = 0;
    }
    // div for min width
    divEl = document.createElement('div');
    divEl.style.width = '170px';
    divEl.style.fontSize = '1px';
    divEl.style.lineHeight = '1';
    divEl.innerHTML = '&nbsp;';
    _panel.appendChild(divEl);
    document.body.appendChild(_panel);

    for ( var i=0; i<allOpts.length; i++ ) {
      var anOpt = allOpts[i];
      _fringe.addOption(anOpt);
    }
    
    // keylistener
    document.onkeydown = function(e) {_handleKeys(e);};
  }
  
  function _fadeOut() {
    if (_fadeOpacityIter === 0) {
      _clearTimer();
      return;
    }
    _fadeOpacityIter--;
    _setNewOpacity();
    if (_fadeOpacityIter === 0) {
      _clearTimer();
      return;
    }
  }

  function _fadeIn() {
    if (_fadeOpacityIter === _ANIM_STEPS) {
      _clearTimer();
      return;
    }
    _fadeOpacityIter++;
    _setNewOpacity();
    if (_fadeOpacityIter === _ANIM_STEPS) {
      _clearTimer();
      return;
    }
  }
  
  function _setNewOpacity() {
    // 0 to _ANIM_STEPS
    _panel.style.opacity = (1.0 / _ANIM_STEPS) * _fadeOpacityIter;
    // TODO: handle IE
    if (_fadeOpacityIter === 0 && _panel.style.display !== 'none') {
      _panel.style.display = 'none';
    } else if (_fadeOpacityIter !== 0 && _panel.style.display === 'none') {
      _panel.style.display = 'block';
    }
  }
  
  function _clearTimer() {
    if (_fadeTimer) {
      window.clearInterval(_fadeTimer);
      _fadeTimer = null;
    }
  }
  
  
  /*
   * =====================================================================
   * PUBLIC FUNCTIONS
   *
   */
  this.initialize = function(config) {
    _config = config || {};
    _config.options = _config.options || [];
    
    if (_config.magicString) {
      _magicString = _config.magicString;
    }
    
    // create (name->option) map and set value to default
    for ( var i=0; i<_config.options.length; i++ ) {
      var anOpt = _config.options[i];
      anOpt['value'] = anOpt.defaultValue;
      _configMap[anOpt.name] = anOpt;
      anOpt._inited = true;
    }
  };
  
  this.render = function() {
    _createPanel();
  }
  
  this.togglePanel = function() {
    _clearTimer();
    _panelIntendedVisible = !_panelIntendedVisible;
    if (_panelIntendedVisible) {
      _fadeTimer = window.setInterval(_fadeIn, _ANIM_DURATION / _ANIM_STEPS);
    } else {
      _fadeTimer = window.setInterval(_fadeOut, _ANIM_DURATION / _ANIM_STEPS);
    }
  }
  
  this.addOption = function(anOpt) {
    var btn,
        contEl,
        aVal,
        anEl;
    
    if (!anOpt._inited) {
      anOpt['value'] = anOpt.defaultValue;
      _configMap[anOpt.name] = anOpt;
      anOpt._inited = true;
    }
    if (_panel === null) {
      _deferredOpts.push(anOpt);
      return;
    }
    
    contEl = document.createElement('p');
    
    if (anOpt.type === 'boolean')
    {
      btn = document.createElement('a');
      btn.href = '#';
      btn.className = 'button';
      btn.innerHTML = anOpt.values[((anOpt.value) ? 1 : 0)];
      btn.onclick = function(event) {
        _handleOptionClick(this, anOpt);
        this.blur();
        return false;
      };
      contEl.appendChild(btn);
    }
    else if (anOpt.type === 'multi')
    {
      contEl.innerHTML = anOpt.name + ':&nbsp;';
      for ( var i=0; i<anOpt.values.length; i++ ) {
        aVal = anOpt.values[i];
        anEl = document.createElement('input');
        anEl.type = 'radio';
        anEl.name = 'FRG__RAD__' + anOpt.name;
        anEl.value = aVal;
        anEl.id = 'FRG__RAD__ID__' + aVal;
        if (anOpt.value == aVal) {
          anEl.checked = true;
        }
        anEl.onclick = function(event) {
          _handleOptionClick(this, anOpt, this.value);
          this.blur();
        };
        contEl.appendChild(anEl);
        
        anEl = document.createElement('label');
        anEl.htmlFor = 'FRG__RAD__ID__' + aVal;
        anEl.innerHTML = aVal;
        contEl.appendChild(anEl);
        contEl.appendChild(document.createTextNode(' '));
      }
    }
    else if (anOpt.type === 'range')
    {
      // defaults
      anOpt.min = (anOpt.min !== undefined) ? anOpt.min : 1;
      anOpt.max = (anOpt.max || 100);
      anOpt.step = (anOpt.step || 1);
      anOpt.unitLabel = (anOpt.unitLabel || '');
      anOpt.unitDecimals = (anOpt.unitDecimals || 0);

      contEl.innerHTML = anOpt.name + ':&nbsp;';
      anEl = document.createElement('span');
      anEl.id = 'FRG__CURVAL__ID__' + anOpt.name;
      anEl.innerHTML = anOpt.value.toFixed(anOpt.unitDecimals) + anOpt.unitLabel;
      contEl.appendChild(anEl);
      anEl = document.createElement('div');
      anEl.id = 'FRG__SLIDER__ID__' + anOpt.name;
      anEl.style.width = '120px';
      anEl.style.display = 'inline-block';
      anEl.style.marginLeft = '7px';
      contEl.appendChild(anEl);
    }

    _panel.appendChild(contEl);

    // perform any post-append actions that require elements to be attached to DOM
    if (anOpt.type === 'range') {
      $('#FRG__SLIDER__ID__' + anOpt.name).slider({
        value: anOpt.value,
        min: anOpt.min,
        max: anOpt.max,
        step: anOpt.step,
        slide: function( event, ui ) {
          document.getElementById('FRG__CURVAL__ID__' + anOpt.name).innerHTML = ui.value.toFixed(anOpt.unitDecimals) + anOpt.unitLabel;
          _handleOptionClick(this, anOpt, ui.value);
        }
      });
    }
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
