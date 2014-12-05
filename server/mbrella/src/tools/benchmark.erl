-module (benchmark).
-compile (export_all).

test(M, F, A, N) when N > 0 ->
    L = test_loop(M, F, A, N, []),
    Length = length(L),
    Min = lists:min(L),
    Max = lists:max(L),
    Med = lists:nth(round((Length / 2)), lists:sort(L)),
    Avg = round(lists:foldl(fun(X, Sum) -> X + Sum end, 0, L) / Length),
    io:format("Range: ~b - ~b mics~n"
        "Median: ~b mics~n"
        "Average: ~b mics~n",
        [Min, Max, Med, Avg]),
    Med.

test_loop(_M, _F, _A, 0, List) ->
    List;
test_loop(M, F, A, N, List) ->
    {T, _Result} = timer:tc(M, F, A),
    test_loop(M, F, A, N - 1, [T|List]).

test_process_sizes() ->
  Test1 = spawn(fun() -> testSize1() end),
  Test2 = spawn(fun() -> testSize2() end).

testSize1() ->
  Var = 2,
  testSizeFun(Var),
  io:format("Test1: ~p~n", [erlang:process_info(self(), memory)] ).

testSize2() ->
  Var = 2,
  Fun = fun(Num) -> Num * Num end,
  Fun( Var ),
  Fun( Var ),
  io:format("Test2: ~p~n", [erlang:process_info(self(), memory)] ).

testSizeFun(Num) -> Num * Num.

