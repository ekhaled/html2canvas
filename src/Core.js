var html2canvas = {};

html2canvas.logging = true;

html2canvas.log = function(a){    
    if (html2canvas.logging){    
        window.console.log(a);
    }
};    

html2canvas.Util = {};

html2canvas.Util.backgroundImage = function (src) {
  
    if (src.substr(0, 5) === 'url("') {
        src = src.substr(5);
        src = src.substr(0, src.length - 2);                 
    }else{
        src = src.substr(4);
        src = src.substr(0, src.length - 1);  
    }

    return src;  
};

html2canvas.Util.getCSS = function (el, attribute) {
    // return jQuery(el).css(attribute);
 
    if (el.currentStyle) {
        return el.currentStyle[attribute];
    } else if (window.getComputedStyle) {
        return document.defaultView.getComputedStyle(el, null)[attribute];
    }
  
};

html2canvas.Util.Extend = function (options, defaults) {
    var key;
    for (key in options) {              
        if (options.hasOwnProperty(key)) {
            defaults[key] = options[key];
        }
    }
    return defaults;           
};

