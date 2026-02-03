var main = {
  bigImgEl: null,
  numImgs: null,

  init: function() {
    main.bindNavbarShrink();
    main.bindNavbarCollapse();
    main.bindNestedNavMenus();
    main.syncMenuWidths();
    main.initImgs();
  },

  bindNavbarShrink: function() {
    // Shorten the navbar after scrolling a little bit down
    $(window).scroll(function() {
      if ($(".navbar").offset().top > 50) {
        $(".navbar").addClass("top-nav-short");
        $(".navbar-custom .avatar-container").fadeOut(500);
      } else {
        $(".navbar").removeClass("top-nav-short");
        $(".navbar-custom .avatar-container").fadeIn(500);
      }
    });
  },

  bindNavbarCollapse: function() {
    // On mobile, hide the avatar when expanding the navbar menu
    $('#main-navbar').on('show.bs.collapse', function() {
      $(".navbar").addClass("top-nav-expanded");
    });
    $('#main-navbar').on('hidden.bs.collapse', function() {
      $(".navbar").removeClass("top-nav-expanded");
    });
  },

  bindNestedNavMenus: function() {
    // On mobile, when clicking on a multi-level navbar menu, show the child links
    $('#main-navbar').on("click", ".navlinks-parent", function(e) {
      const target = e.target;
      $.each($(".navlinks-parent"), function(key, value) {
        if (value == target) {
          $(value).parent().toggleClass("show-children");
        } else {
          $(value).parent().removeClass("show-children");
        }
      });
    });
  },

  syncMenuWidths: function() {
    // Ensure nested navbar menus are not longer than the menu header
    const menus = $(".navlinks-container");
    if (menus.length === 0) {
      return;
    }

    const navbar = $("#main-navbar ul");
    const fakeMenuHtml = "<li class='fake-menu' style='display:none;'><a></a></li>";
    navbar.append(fakeMenuHtml);
    const fakeMenu = $(".fake-menu");

    $.each(menus, function(i) {
      const children = $(menus[i]).find(".navlinks-children a");
      let words = [];
      $.each(children, function(idx, el) {
        words = words.concat($(el).text().trim().split(/\s+/));
      });

      let maxwidth = 0;
      $.each(words, function(id, word) {
        fakeMenu.html("<a>" + word + "</a>");
        const width = fakeMenu.width();
        if (width > maxwidth) {
          maxwidth = width;
        }
      });
      $(menus[i]).css('min-width', maxwidth + 'px');
    });

    fakeMenu.remove();
  },

  initImgs: function() {
    // If the page has large images to randomly select from, choose an image
    if ($("#header-big-imgs").length === 0) {
      return;
    }

    main.bigImgEl = $("#header-big-imgs");
    main.numImgs = main.bigImgEl.attr("data-num-img");

    // 2fc73a3a967e97599c9763d05e564189
    const imgInfo = main.getImgInfo();
    main.setImg(imgInfo.src, imgInfo.desc);

    // If there are multiple images, cycle through them
    if (main.numImgs > 1) {
      main.scheduleNextImg();
    }
  },

  scheduleNextImg: function() {
    // For better UX, prefetch the next image so that it will already be loaded when we want to show it
    const imgInfo = main.getImgInfo();
    const src = imgInfo.src;
    const desc = imgInfo.desc;

    const prefetchImg = new Image();
    prefetchImg.src = src;

    setTimeout(function() {
      const img = $("<div></div>").addClass("big-img-transition").css("background-image", 'url(' + src + ')');
      $(".intro-header.big-img").prepend(img);
      setTimeout(function() { img.css("opacity", "1"); }, 50);

      // after the animation of fading in the new image is done, prefetch the next one
      setTimeout(function() {
        main.setImg(src, desc);
        img.remove();
        main.scheduleNextImg();
      }, 1000);
    }, 6000);
  },

  getImgInfo: function() {
    const randNum = Math.floor((Math.random() * main.numImgs) + 1);
    const src = main.bigImgEl.attr("data-img-src-" + randNum);
    const desc = main.bigImgEl.attr("data-img-desc-" + randNum);

    return {
      src: src,
      desc: desc,
    };
  },

  setImg: function(src, desc) {
    $(".intro-header.big-img").css("background-image", 'url(' + src + ')');
    if (desc !== undefined && desc !== false) {
      $(".img-desc").text(desc).show();
    } else {
      $(".img-desc").hide();
    }
  },
};

// 2fc73a3a967e97599c9763d05e564189

document.addEventListener('DOMContentLoaded', main.init);
