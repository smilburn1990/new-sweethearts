export function makeChain(attrs, main) {
  //Dynamic keys functions
  Object.keys(attrs).forEach((key) => {
    // Attach variables to main function
    return (main[key] = function (_) {
      if (!arguments.length) {
        return attrs[key];
      }

      attrs[key] = _;
      return main;
    });
  });
}

export function ordinal_suffix_of(i) {
  var j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

export function findSuffixOf(i) {
  var j = i % 10,
    k = i % 100;

  if (j === 1 && k !== 11) {
    return "st";
  }

  if (j === 2 && k !== 12) {
    return "nd";
  }

  if (j === 3 && k !== 13) {
    return "rd";
  }

  return "th";
}

export const globals = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function () {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function () {
    return (
      globals.Android() ||
      globals.BlackBerry() ||
      globals.iOS() ||
      globals.Opera() ||
      globals.Windows() ||
      window.innerWidth <= 768
    );
  },
  get isMobile() {
    return globals.any();
  }
};

export function roundNum(num) {
  return Math.round(num * 100) / 100;
}
