-module(rangedict).


-compile(export_all).
-export([fetch/2,find/2,fetch_keys/1,erase/2,map/2,store/3]).

-record(range, {min, max, dict=sorteddict:new(), type}).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).


new() -> #range{}.

addRange(L, R, Dict, OnAdd) ->
  sorteddict:foldRange(fun(Key, Val, _) -> OnAdd(Val) end, null, Dict, L, R).

removeRange(L, R, Dict, OnRemove) ->
  sorteddict:foldRange(fun(Key, Val, _) -> OnRemove(Val) end, null, Dict, L, R).

addPosRange(L, R, Dict, OnAdd) ->
  sorteddict:foldPosRange(fun(Key, Val, _) -> OnAdd(Val) end, null, Dict, L, R).

removePosRange(L, R, Dict, OnRemove) ->
  sorteddict:foldPosRange(fun(Key, Val, _) -> OnRemove(Val) end, null, Dict, L, R).


inRange(Key, Range) ->
  case Range#range.type of
    undefined -> true;
    KeyOrPos ->
      CurInd = sorteddict:getNearestIndexLeft(Key, Range#range.dict),
      case KeyOrPos of
        key -> CurInd >= sorteddict:getNearestIndexRight(Range#range.min, Range#range.dict) andalso CurInd =< sorteddict:getNearestIndexLeft(Range#range.max, Range#range.dict);
        pos -> CurInd >= Range#range.min andalso CurInd =< Range#range.max
      end
  end.

updateRange(NewRange, OldRange, OnAdd, OnRemove) ->
  #range{min=OldMin, max=OldMax, dict=Dict, type=OldType} = OldRange,
  #range{min=NewMin, max=NewMax, type=NewType} = NewRange,

  case {OldType, NewType} of
    {key, key} ->
      if
        NewMin > OldMin -> removeRange(OldMin, sorteddict:getPrevKey(NewMin, Dict), Dict, OnRemove);
        NewMin < OldMin -> addRange(NewMin, sorteddict:getPrevKey(OldMin, Dict), Dict, OnAdd);
        true -> nochange
      end,
      if
        OldMax > NewMax -> removeRange(sorteddict:getNextKey(NewMax, Dict), OldMax, Dict, OnRemove);
        OldMax < NewMax -> addRange(sorteddict:getNextKey(OldMax, Dict), NewMax, Dict, OnAdd);
        true -> nochange
      end;
    {pos, pos} ->
      if
        NewMin > OldMax orelse NewMax < OldMin ->
          removeRange(OldMin, OldMax, Dict, OnRemove),
          addRange(NewMin, NewMax, Dict, OnAdd);
        true ->
          if
            NewMin > OldMin -> removePosRange(OldMin, NewMin - 1, Dict, OnRemove);
            NewMin < OldMin -> addPosRange(NewMin, OldMin - 1, Dict, OnAdd);
            true -> nochange
          end,
          if
            OldMax > NewMax -> removePosRange(NewMax + 1, OldMax, Dict, OnRemove);
            OldMax < NewMax -> addPosRange(OldMax + 1, NewMax, Dict, OnAdd);
            true -> nochange
          end
      end;
    %TODO: take care of key/pos conversions
    %For now, don't allow these changes to occur
    {_,_} -> nochange
  end.

setKeyRange({Start, End}, OnAdd, OnRemove, Range) ->
  OldRange = case Range#range.type of
    undefined ->
      Range#range{min=0, max=sorteddict:size(Range#range.dict), type=pos};
    _ ->
      #range{
        min=sorteddict:getNearestIndexRight(Range#range.min, Range#range.dict),
        max=sorteddict:getNearestIndexLeft(Range#range.max, Range#range.dict),
        type=pos
      }
  end,
  NewRange = Range#range{
    min=Start,
    max=End,
    type=key
  },
  CurRange =
    Range#range{
      min=sorteddict:getNearestIndexRight(Start, Range#range.dict),
      max=sorteddict:getNearestIndexLeft(End, Range#range.dict),
      type=pos
    },
  updateRange(CurRange, OldRange, OnAdd, OnRemove),
  NewRange.

setPosRange({Start, End}, OnAdd, OnRemove, Range) ->
  OldRange = case Range#range.type of
    undefined ->
      Range#range{min=0, max=sorteddict:size(Range#range.dict), type=pos};
    _ ->
      Range
  end,
  NewRange = OldRange#range{min=Start, max=End, type=pos},
  updateRange(NewRange, OldRange, OnAdd, OnRemove),
  NewRange.

clearRange(OldRange, OnAdd, OnRemove) ->
  NewRange = OldRange#range{min=undefined, max=undefined, type=undefined},
  updateRange(NewRange, OldRange, OnAdd, OnRemove),
  NewRange.

toSortedDict(Range) ->
  Range#range.dict.

%%TODO: make this work for type = pos
mapRange(F, Range) ->
  NewDict = case Range#range.type of
    undefined -> sorteddict:map(F, Range#range.dict);
    key -> sorteddict:mapRange(F, Range#range.dict, Range#range.min, Range#range.max);
    pos -> sorteddict:mapPosRange(F, Range#range.dict, Range#range.min, Range#range.max)
  end,
  Range#range{dict = NewDict}.

%% pass through the needed sorteddict functions

fetch(A, B) -> sorteddict:fetch(A, B#range.dict).
find(A, B) -> sorteddict:find(A, B#range.dict).
fetch_keys(B) -> sorteddict:fetch_keys(B#range.dict).
erase(A, B) -> B#range{dict = sorteddict:erase(A, B#range.dict)}.
map(A, B) -> B#range{dict = sorteddict:map(A, B#range.dict)}.
store(A, A2, B) -> B#range{dict = sorteddict:store(A, A2, B#range.dict)}.
getIndex(A, B) -> sorteddict:getIndex(A, B#range.dict).
getByIndex(A, B) -> sorteddict:getByIndex(A, B#range.dict).