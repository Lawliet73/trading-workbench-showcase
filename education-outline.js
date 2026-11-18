/* Single approved beginner curriculum for every access level.
   Shared/private editions add depth, never replace these topics. */
(function(root){
'use strict';
const chapters=[
 ['Getting started','What happens when you buy a share?',
 'A share represents a small ownership interest in a company. An investor places an order, a broker sends it to a market, and a trade happens when a buyer and seller agree on a price.',
 'You want to buy 2 shares at €50 each. If a seller accepts that price, you pay about €100 before fees. If nobody accepts your price, your order can remain unfilled.',
 'Orders, exchanges, trading mechanics'],
 ['Getting started','Why do prices move?',
 'Prices change because buyers and sellers react to new information, expectations and available supply. A company can report strong profits yet its stock can fall when people expected even better results.',
 'A company earns €10 million, up from €8 million. Its stock could still drop if investors had expected €15 million.',
 'Market information, price formation'],
 ['Research basics','What is a trading strategy?',
 'A strategy is a set of rules for deciding when to buy, sell, or do nothing. The goal of research is to test whether those rules are better than a simple comparison after realistic costs.',
 'One rule might buy only when a price rises above its average over the last 50 days. That is a testable idea, not evidence that the rule earns money.',
 'Strategies, signals, decisions'],
 ['Research basics','What does a backtest tell us?',
 'A backtest applies a strategy to historical data to simulate past decisions. It helps find weaknesses but cannot guarantee future performance.',
 'Imagine testing the same buy/sell rule over 2018–2025. The result must include fees and failed trades, not just the best profitable examples.',
 'Backtesting, validation, simulated trading'],
 ['Research basics','Why is old information not always usable?',
 'A historical price or earnings report may be dated earlier than when traders could actually see it. A reliable test asks what information was available at that moment.',
 'A report about March earnings published in May cannot be used in a simulation that places a trade in April.',
 'Information timing, data quality'],
 ['Evaluating ideas','How do we know a strategy is not just lucky?',
 'A convincing-looking result can happen by accident, especially when many versions are tried. Researchers compare a rule with a simple baseline and test it on periods they did not use to choose it.',
 'If you test 100 different signals, one may look excellent by chance. Try the chosen signal on untouched data before treating it as promising.',
 'Statistical testing, overfitting'],
 ['Evaluating ideas','What is momentum?',
 'Momentum describes a tendency for an asset that has recently risen or fallen to keep moving in that direction for some time. It is a hypothesis to investigate, not a guarantee.',
 'A stock rises from €40 to €50. A momentum model asks whether similar price changes were followed by further rises often enough to matter after costs.',
 'Momentum, trend strategies'],
 ['Evaluating ideas','What is an event-driven strategy?',
 'This type of research looks for how markets react to identifiable events, such as company earnings, takeovers or unexpected announcements.',
 'If a company reports an earnings surprise, a model can check whether the price reaction continues over the following days. The project must still test that idea.',
 'Earnings, events, market reactions'],
 ['Managing decisions','What does risk control do?',
 'Risk controls limit what a system is allowed to buy or sell and how much money it may expose. A promising research signal can be rejected by those limits.',
 'A strategy requests a €5,000 purchase, but the planned risk limit permits only €1,000. The request is reduced or refused.',
 'Position sizing, exposure, risk gates'],
 ['Managing decisions','What is the difference between research and real trading?',
 'Research asks whether an idea deserves testing. Real trading adds broker orders, fees, changing liquidity and the possibility that an order will not execute as expected.',
 'A simulation buys 100 shares at €10. In a real market the shares might fill at several prices, or not all at once.',
 'Research, execution, live trading'],
 ['Putting it together','How do these parts connect?',
 'Information enters through market data and company events. Models transform it into possible decisions. Testing checks whether those decisions had merit. Risk controls decide whether a proposed trade is permitted.',
 'Think of a weather forecast: sensors provide observations, a model makes a prediction, earlier predictions are scored, and an operator decides whether to act.',
 'Data → models → tests → decisions'],
 ['Putting it together','What does “planned” mean on this site?',
 'Some elements are already implemented, while others describe a future workflow or an idea under investigation. A diagram can show a planned connection without claiming that it operates today.',
 'A planned broker connection on a diagram is like a proposed new train line on a map: it explains the intended route, not that trains are already running.',
 'Status labels, roadmap']
];
const order=[...new Set(chapters.map(c=>c[0]))];
const id=x=>String(x).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const modules=order.map((name,i)=>({id:'study-'+(i+1),title:name,summary:'Introduction to '+name.toLowerCase()+'.',track:'A'}));
const topics=chapters.map((c,i)=>({id:'lesson-'+String(i+1).padStart(2,'0'),module:'study-'+(order.indexOf(c[0])+1),group:c[0],title:c[1],explanation:c[2],example:c[3],related:c[4],link:'#tab=learn&topic='+i}));
root.TWK_EDUCATION=Object.freeze({modules,topics,chapters});
})(window);
