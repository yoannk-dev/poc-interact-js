class Draggable {
  constructor() {
    this._wallWidthValue = 300;
    this._wallHeightValue = 200;
    this._wallRatio = 1.5;
    this._currentElement = null;
  }

  get wallWidthValue() {
    return this._wallWidthValue;
  }

  set wallWidthValue(data) {
    this._wallWidthValue = data;
  }

  get wallHeightValue() {
    return this._wallHeightValue;
  }

  set wallHeightValue(data) {
    this._wallHeightValue = data;
  }

  get wallRatio() {
    return this._wallRatio;
  }

  set wallRatio(data) {
    this._wallRatio = data;
  }

  get currentElement() {
    return this._currentElement;
  }

  set currentElement(data) {
    this._currentElement = data;
  }

  handleOptions(target) {
    if (target) {
      this.currentElement = target;
      document.getElementById('noOptions').classList.add('hidden');
      document.getElementById('yesOptions').classList.remove('hidden');
      document.getElementById('draggableZIndex').value = this.currentElement.style['z-index'];
    }
  }

  setWallRatio() {
    return this.wallWidthValue / this.wallHeightValue;
  }

  setZIndex(event) {
    draggable.currentElement.style['z-index'] = event.target.value;
  }

  updateWallInputs(e) {
    if (e.target.id === 'wallWidth') {
      draggable.wallWidthValue = e.target.value;
    } else if (e.target.id === 'wallHeight') {
      draggable.wallHeightValue = e.target.value;
    }
    // update live wall ratio
    draggable.updateWallRatio();
  }

  updateWallRatio() {
    const wall = document.getElementById('wall');
    const wallRatioDiv = document.getElementById('wallRatio'); 
    //update wall ratio
    draggable.wallRatio = draggable.setWallRatio();
    wallRatioDiv.innerHTML = draggable.wallRatio;
    //update wall dimensions in interface
    wall.style.height = wall.offsetWidth / draggable.wallRatio + "px";
  }

  getDragAngle(event) {
    var box = event.target.parentElement;
    var startAngle = parseFloat(box.getAttribute('data-angle')) || 0;
    var center = {
      x: parseFloat(box.getAttribute('data-center-x')) || 0,
      y: parseFloat(box.getAttribute('data-center-y')) || 0
    };
    var angle = Math.atan2(center.y - event.clientY,
      center.x - event.clientX);
  
    return angle - startAngle;
  }

  interactWall() {
    interact('#wall')
    .dropzone({
      accept: '.draggable',
      ondrop: function (event) {
        draggable.handleOptions(event.relatedTarget);
      }
    })
    .on('dropactivate', function (event) {
      event.target.classList.add('border-black');
    })
    .on('dropdeactivate', function (event) {
      event.target.classList.remove('border-black');
    });
  }

  interactDraggable() {
    interact('.draggable')
    .resizable({
      // resize from all edges and corners
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move (event) {
          var target = event.target
          var x = (parseFloat(target.getAttribute('data-x')) || 0);
          var y = (parseFloat(target.getAttribute('data-y')) || 0);
          var angle = (parseFloat(target.getAttribute('data-angle')) || 0);

          // update the element's style
          target.style.width = event.rect.width + 'px';
          target.style.height = event.rect.height + 'px';

          // translate when resizing from top or left edges
          x += event.deltaRect.left;
          y += event.deltaRect.top;

          target.style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + angle + 'rad' + ')';

          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

        }
      },
      modifiers: [
        interact.modifiers.aspectRatio({
          ratio: 'preserve'
        }),
        interact.modifiers.restrictSize({
          min: { width: 50, height: 50 },
          max: { width: 500, height: 500 }
        })
      ]
    })
    .draggable({
      onmove: function(event) {
        var target = event.target;   
        var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        var angle = (parseFloat(target.getAttribute('data-angle')) || 0);
        
        // update transform style on dragmove
        target.style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + angle + 'rad' + ')';

        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
        target.style.opacity = ".5";
      },
      onend: function(event) {
        if (!event.relatedTarget) {
          // pas dans la dropzone, on efface le clone
          interact(event.target).unset();
          event.target.remove();
        } else {
          const wall = document.getElementById('wall');
          if (event.target.parentElement.id !== 'wall') {
            let rotateHandle = document.createElement('div');
            rotateHandle.classList.add('rotation-handle');
            rotateHandle.innerHTML = '&circlearrowright;';
            event.target.appendChild(rotateHandle);
            wall.append(event.target);
          }
        }
        event.target.style.opacity = "1";
      }
    })
    .on('move', function (event) {
      var interaction = event.interaction;
      if (interaction.pointerIsDown && !interaction.interacting() && event.currentTarget.getAttribute('clonable') != 'false') {
        var original = event.currentTarget;
        var clone = event.currentTarget.cloneNode(true);
        // var x = clone.offsetLeft;
        // var y = clone.offsetTop;
        clone.setAttribute('clonable','false');
        clone.style.position = "absolute";
        clone.style.left = original.offsetLeft+"px";
        clone.style.top = original.offsetTop+"px";
        clone.style['z-index'] = 0;
        original.parentElement.appendChild(clone);
        interaction.start({ name: 'drag' }, event.interactable, clone);
      }
    })
    .on('click', function (event) {
      if (event.target.parentElement.id === 'wall') {
        draggable.handleOptions(event.target);
      }
    });
  }

  interactRotation() {
    interact('.rotation-handle')
    .draggable({
      onstart: function(event) {
        var box = event.target.parentElement;
        var rect = box.getBoundingClientRect();

        // store the center as the element has css `transform-origin: center center`
        box.setAttribute('data-center-x', rect.left + rect.width / 2);
        box.setAttribute('data-center-y', rect.top + rect.height / 2);
        // get the angle of the element when the drag starts
        box.setAttribute('data-angle', draggable.getDragAngle(event));
      },
      onmove: function(event) {
        var box = event.target.parentElement;

        var pos = {
          x: parseFloat(box.getAttribute('data-x')) || 0,
          y: parseFloat(box.getAttribute('data-y')) || 0
        };

        var angle = draggable.getDragAngle(event);

        // update transform style on dragmove
        box.style.transform = 'translate(' + pos.x + 'px, ' + pos.y + 'px) rotate(' + angle + 'rad' + ')';
      },
      onend: function(event) {
        var box = event.target.parentElement;

        // save the angle on dragend
        box.setAttribute('data-angle', draggable.getDragAngle(event));
      },
    })
  }

  save() {
    const elementsAdded = document.querySelectorAll('#wall .draggable');
    console.log(elementsAdded);
  }

  static init() {
    return new this();
  }
}

document.addEventListener('load', Draggable.init());
const draggable = new Draggable();

document.addEventListener('DOMContentLoaded', function(event) {
  /**
   * WALL INPUTS 
   */
  const wall = document.getElementById('wall');
  const wallWidthInput = document.getElementById('wallWidth');
  const wallHeightInput = document.getElementById('wallHeight');
  const elementZIndexInput = document.getElementById('draggableZIndex');
  const wallRatioDiv = document.getElementById('wallRatio');
  const saveButton = document.getElementById('save');
  // init wall DOM with default values
  wallWidthInput.value = draggable.wallWidthValue;
  wallHeightInput.value = draggable.wallHeightValue;
  wallRatioDiv.innerHTML = draggable.wallRatio;
  wall.style.height = wall.offsetWidth / draggable.wallRatio + "px";
  // Events Listener
  wallWidthInput.addEventListener('change', draggable.updateWallInputs);
  wallHeightInput.addEventListener('change', draggable.updateWallInputs);
  elementZIndexInput.addEventListener('change', draggable.setZIndex);
  saveButton.addEventListener('click', draggable.save);
  // Interactions
  draggable.interactWall();
  draggable.interactDraggable();
  draggable.interactRotation();
});
