 var sidebarCollapsedOut = false;
 var sidebarExpandedOut = false;

$(function () { //on load

setTimeout(function() {
  $( "html" ).removeClass( "loading" );
}, 1000);

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].onclick = function(){
      togglePanel(this);
        if(this.classList.contains("active")) {
          var siblings = $(this).siblings();
          for(var j = 0; j < siblings.length; j++) {
            if(siblings[j].classList.contains("active")) {
              togglePanel(siblings[j]);
            }
          }
        }
    }
}

 document.onmousemove = function(e){
    y=e.clientY;
    if(!sidebarCollapsedOut && !sidebarExpandedOut) {
    if (y < 50) {
       document.getElementById('sessionNav').style.top = "0px";
    } else if (y > 50) {
        document.getElementById('sessionNav').style.top = "-62px";
    }
  }

}

$(".dim").click(function() {
  closeExpandedNav();
})

  
  //Camera Disable Button
  $(".disable-button").click(function() {
    $(this).toggleClass("disable enable");
    if($(this).hasClass("disable")) {
      $(this).html("Disable Camera");
      $(this).parent().find(".dropdown-toggle").removeClass("disabled");
    } else {
       $(this).html("Enable Camera");
       $(this).parent().find(".dropdown-toggle").addClass("disabled");
    }
  })
})

 // $("#dropzone").dropzone();

function openNav() {
    document.getElementById("sidenavCollapsed").style.left = "90%";
    sidebarCollapsedOut = true;
    //$('.dim').fadeIn(200);
}

/* Set the width of the side navigation to 0 */
function closeCollapsedNav() {
    document.getElementById("sidenavCollapsed").style.left = "100%";
    sidebarCollapsedOut = false;
    //if(!sidebarExpandedOut){$('.dim').fadeOut(200);}
}

function closeAllPanel() {
  var acc = document.getElementsByClassName("accordion");
  for (var i = 0; i < acc.length; i++) {
    var panel = acc[i];
    if (panel.classList.contains("active")) {
      togglePanel(panel);
    }
}
}

function closeExpandedNav() {
  document.getElementById("sidenavExpanded").style.left = "100%";
  closeAllPanel();
  sidebarExpandedOut = false;
  $('.dim').fadeOut(200);
}

function showExpanded(section) {
  document.getElementById("sidenavExpanded").style.left = "80%";
  sidebarExpandedOut = true;
  closeCollapsedNav();
  openSection(section);
  $('.dim').fadeIn(200);
}

function openSection(name) {
  var panelName = name + "-button";
  var elem = document.getElementById(panelName);
  togglePanel(elem);
}

function togglePanel(panel) {
        panel.classList.toggle("active");
        panel.nextElementSibling.classList.toggle("show");
}

function closePanel(panel) {
        panel.classList.remove("active");
        panel.nextElementSibling.classList.remove("show");
}
