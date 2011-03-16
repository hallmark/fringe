
# Fringe

  Fast experimental tweaking of web pages using a single, simple JavaScript include.
  
    $fr.initialize({visible: true});
    $fr.addOption({
      name: 'Carousel',
      defaultValue: false,
      type: 'boolean',
      labels: ['slide', 'fade'],
      onActivate: function(value) {
        myCode.setEffect(value);
      }
    });
    
    $fr.render();

## Features

  * Add to webpage with a single script include
  * Invoke callback when option changes
  * Test variants on mobile devices
  * Collaborate on webpage variants with remote teams
