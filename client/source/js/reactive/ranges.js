function makeRangedView(onAdd, onRemove, sSet) {
  var rView = {};

  var range;

  var forInd = function (startInd, endInd, f) {
    for (; startInd <= endInd; startInd++) {
      f(sSet.getByIndex(startInd), sSet.getKeyByIndex(startInd));
    }
  };

  var forCustomRange = function (range, f) {
    if (range == undefined) {
      sSet.forEach(f);
      return;
    }
    if (range.type == 'key') {
      forInd(sSet.getNearestIndexRight(range.start), sSet.getNearestIndexLeft(range.end), f);
    } else {
      forInd(range.start, range.end, f);
    }
  };

  var removeRange = function (range) {
    forCustomRange(range, function(dot, key) {
      onRemove(dot);
    });
  };

  var addRange = function (range) {
    forCustomRange(range, function(dot, key) {
      onAdd(dot);
    });
  };

  rView.getFirstIndex = function () {
    if (range.type == 'key') {
      return sSet.getNearestIndexRight(range.start);
    } else {
      return range.start;
    }
  };

  rView.forRange = function (f) {
    forCustomRange(range, f);
  };

  rView.inRange = function (key) {
    if (range == undefined) return true;
    var curInd = sSet.getIndex(key);
    if (range.type === 'key') {
      return (curInd >= sSet.getIndex(range.start) && curInd <= sSet.getIndex(range.end));
    } else {
      return (curInd >= sSet.getNearestIndexRight(range.start) && curInd <= sSet.getNearestIndexLeft(range.end));
    }
  };

  rView.updateRange = function (oldRange, newRange) {
    if (newRange.start > oldRange.end || newRange.end < oldRange.start) {
      removeRange(oldRange);
      addRange(newRange);
    } else {
      if (newRange.start > oldRange.start) {
        removeRange({start:oldRange.start, end:newRange.start-1, type:'pos'});
      } else if (newRange.start < oldRange.start){
        addRange({start:newRange.start, end:oldRange.start-1, type:'pos'});
      }
      if (oldRange.end > newRange.end) {
        removeRange({start:newRange.end+1, end:oldRange.end, type:'pos'});
      } else if (oldRange.end < newRange.end){
        addRange({start:oldRange.end+1, end:newRange.end, type:'pos'});
      }
    }
  };

  rView.clearRange = function () {
    var oldRange;
    if (range !== undefined) {
      if (range.type == 'pos') {
         oldRange = range;
      } else {
        oldRange = {start:sSet.getNearestIndexRight(range.start), end:sSet.getNearestIndexLeft(range.end), type:'pos'};
      }
    } else {
      oldRange = {start:0, end:-1, type:'pos'};
    }
    var newRange = {start:0, end:-1, type:'pos'};

    rView.updateRange(oldRange, newRange);

    range = newRange;
  };

  rView.setPosRange = function (start, end) {
    var oldRange;
    if (range) {
      oldRange = range;
    } else {
      oldRange = {start:0, end:-1, type:'pos'};
    }
    range = {start:start, end:end, type:'pos'};

    rView.updateRange(oldRange, range);
  };

  rView.setKeyRange = function (start, end) {
    var oldRange;
    if (range) {
      oldRange = {start:sSet.getNearestIndexRight(range.start), end:sSet.getNearestIndexLeft(range.end), type:'pos'};
    } else {
      oldRange = {start:0, end:-1, type:'pos'};
    }
    range = {start:start, end:end, type:'key'};
    newRange = {start:sSet.getNearestIndexRight(start), end:sSet.getNearestIndexLeft(end), type:'pos'};
    rView.updateRange(oldRange, newRange);
  };

  return rView;
}