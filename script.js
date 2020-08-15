let vm = new Vue({
  el: "#app",
  data: {
    seq: "",
    errorMsg: "",
    warningMsg: "",
    pngHref: "",
    jpgHref: "",
    width: 800,
    height: 40,
    sketch: null,
    showLabels: true,
    chartColour: "#33C3F0",
    labelColour: "#000000",
    sketchKey: 0,
  },
  methods: {
    generateGraph: function () {
      if (!this.validateSeq()) { return; }

      console.log("generating graph...");

      this.sketch = processSeq(this.seq, parseInt(this.width), parseInt(this.height), this.chartColour, this.labelColour, this.showLabels);
      this.rerenderGraph();
    },
    saveAsImg: function (filetype) {
      console.log("saving img...");
      const data = document.getElementById("defaultCanvas0").toDataURL(`image/${filetype}`).replace(`image/${filetype}`, 'image/octet-stream');
      const saveLink = document.createElement("a");
      saveLink.download = `sequence.${filetype}`;
      saveLink.href = data;
      saveLink.click();
    },
    rerenderGraph: function () {
      this.sketchKey++;
    },
    validateSeq: function () {
      const lenThreshold = 100000;
      if (this.seq.length <= lenThreshold) { this.warningMsg = ""; };

      if (this.seq === "") {
        this.errorMsg = "Sequence cannot be empty";
        return false;
      }

      const validRegex = /^([agct]+([AGCT]+)?|[AGCT]+([agct]+)?)+$/;
      if (!validRegex.test(this.seq)) {
        this.errorMsg = "Not a valid sequence";
        return false;
      }

      if (!isNumber(this.width)) {
        this.errorMsg = "Width must be a number";
        return false;
      } else if (parseInt(this.width) < 10) {
        this.errorMsg = "Width must be greater than 10";
        return false;
      }

      if (!isNumber(this.height)) {
        this.errorMsg = "Height must be a number";
        return false;
      } else if (parseInt(this.height) < 10) {
        this.errorMsg = "Height must be greater than 10";
        return false;
      }

      if (this.seq.length > lenThreshold) {
        this.warningMsg = "Long sequences may cause browser to hang for a while";
      }

      this.errorMsg = "";
      return true;
    }
  },
});

function isNumber(s) {
  return !isNaN(s);
}

function getCase(char) {
  if (char === char.toUpperCase()) { return "upper"; }
  return "lower";
}

function processSeq(seq, w, h, c, labelC, showLabels) {
  let splitSeq = [];
  let currentChunk = "";
  let currentCase = getCase(seq[0]);

  for (let i = 0; i < seq.length; i++) {
    if (getCase(seq[i]) !== currentCase) {
      splitSeq.push(currentChunk);
      currentChunk = seq[i];
      currentCase = getCase(seq[i]);
    } else {
      currentChunk += seq[i];
    }
  }
  splitSeq.push(currentChunk);


  const sketch = function (p) {
    const charLength = w / seq.length;
    p.setup = function () {
      p.createCanvas(seq.length * charLength, h);
      p.strokeWeight(1);

      // Lines
      for (let i = 0; i < seq.length; i++) {
        const char = seq[i];
        p.stroke(c);
        p.fill(c);

        if (getCase(char) === "upper") {
          const rectH = p.height / 2;
          p.rectMode(p.CORNERS);
          p.rect(charLength * i, p.height / 2 - rectH / 2, charLength * (i + 1), p.height / 2 + rectH / 2);
        } else {
          p.line(charLength * i, p.height / 2, charLength * (i + 1), p.height / 2);
        }
      }

      // TODO: Shorten label text when no space
      if (showLabels) {
        for (let i = 0; i < splitSeq.length; i++) {
          const chunk = splitSeq[i];
          const chunkLen = chunk.length * charLength;

          let startX = 0;
          for (let j = 0; j < i; j++) {
            startX += splitSeq[j].length * charLength;
          }

          const midX = chunkLen / 2 + startX;

          let labelText = "";
          if (getCase(chunk) === "upper") {
            labelText = `Exon ${Math.ceil((i + 1) / 2)}`;
            p.textAlign(p.CENTER, p.CENTER);
          } else {
            labelText = `Intron ${Math.ceil((i + 1) / 2)}`;
            p.textAlign(p.CENTER, p.BOTTOM);
          }

          p.noStroke();
          p.fill(labelC);
          p.textSize(p.height * 0.5);
          p.text(labelText, midX, p.height / 2 + 2.5);
        }
      }
    };
  };
  return sketch;
}