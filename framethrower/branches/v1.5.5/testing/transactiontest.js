var rw = transactions.makeSituation();
transactions.modifyContent(rw, 'Real World');

var JB = transactions.makeIndividual(rw);
transactions.modifyContent(JB, 'James Bond');

var OP = transactions.makeIndividual(rw);
transactions.modifyContent(OP, 'Octopussy');

var SleepsWith = transactions.makeRelation(rw);
transactions.modifyContent(SleepsWith, 'Sleeps With');

var JBSleepsWithOP = transactions.makeInfon(rw, SleepsWith, {sleeper:JB, sleepee:OP});