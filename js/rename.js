/*  说明: https://github.com/Keywos/rule/blob/main/readme.md
用法：Sub-Store脚本操作添加
例如：https://raw.githubusercontent.com/Keywos/rule/main/rename.js#name=测试&flag
日期：2023/05/01
-------------------------------- 
rename.js 以下是此脚本支持的参数，必须以 # 为开头多个参数使用"&"连接，参考上述地址为例使用参数。
[bl]:     保留: 家宽 ，IPLC 几倍之类的标识 ,并分组排序
[nx]:     保留1倍率与不显示倍率的
[blnx]:   只保留高倍率
[one]:    清理只有一个节点的地区的01 
[flag]:   给节点前面加国旗
[clear]:  清理乱七八糟的名字
[in=]:    自动判断机场节点名类型(那种类型多就判断为那种) 也可以加参数指定
[out=]:   输出节点名可选参数: (cn ，us ，quan) 对应：中文，英文缩写 ，英文全称 , 默认中文
[name=]:  添加机场名前缀在节点最前面
*/

const bl = $arguments["bl"];
const nx = $arguments["nx"];
const blnx = $arguments["blnx"];
const numone = $arguments["one"];
const clear = $arguments["clear"];
const addflag = $arguments["flag"];
const nameblnx = /(高倍|(?!1)2+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const namenx = /(高倍|(?!1)(0\.|\d)+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const jcname = $arguments.name == undefined ? "" : decodeURI($arguments.name);
const inname = $arguments["in"] === "cn" ? "cn" : $arguments["in"] === "us" ? "us" : $arguments["in"] === "quan" ? "quan" : "";
function getList(arg) { switch (arg) { case "us": return us; case "quan": return quan; default: return cn;}}
function jxh(e){const n=e.reduce(((e,n)=>{const t=e.find((e=>e.name===n.name));if(t){t.count++;t.items.push({...n,name:`${n.name} ${t.count.toString().padStart(2,"0")}`})}
else{e.push({name:n.name,count:1,items:[{...n,name:`${n.name} 01`}]})}return e}),[]);const t=n.flatMap((e=>e.items));e.splice(0,e.length,...t);return e}
function getflag(e){const n=e.toUpperCase().split("").map((e=>127397+e.charCodeAt()));return String.fromCodePoint(...n).replace(/🇹🇼/g,"🇨🇳")}
function getRegion(proxyName) {if (cn.some((name) => proxyName.includes(name))) {return "cn";} else if (us.some((name) => proxyName.includes(name))) {return "us";} else if (quan.some((name) => proxyName.includes(name))) {return "quan";} else {return null;}}
function oneProxies(proxies){const groups = proxies.reduce((groups, proxy) => { const name = proxy.name.replace(/\s\d+$/, ''); if (!groups[name]) { groups[name] = []; } groups[name].push(proxy);
return groups; }, {});for(const name in groups) {if (groups[name].length === 1 && groups[name][0].name.endsWith(' 01')) {const proxy = groups[name][0];proxy.name = name;}};return proxies;}
function fampx(proxies) {const wis = [];const wnout = [];for (const proxy of proxies) {const fan = specialRegex.some(regex => regex.test(proxy.name));if (fan) {wis.push(proxy);} else {wnout.push(proxy);}}const sps = wis.map(proxy => specialRegex.findIndex(regex => regex.test(proxy.name)));wis.sort((a, b) => sps[wis.indexOf(a)] - sps[wis.indexOf(b)] || a.name.localeCompare(b.name));wnout.sort((a, b) => proxies.indexOf(a) - proxies.indexOf(b));return wnout.concat(wis);}
const nameclear =/(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|备用|群|TEST|客服|网站|获取|订阅|流量|机场|下次|官址|联系|邮箱|工单|学术|USE|USED|TOTAL|EXPIRE|EMAIL)/i;
const us=['HK','MO','TW','JP','KR','SG','SG','US','GB','FR','DE','AU','AU','AE','AF','AL','DZ','AO','AR','AM','AT','AZ','BH','BD','BY','BE','BZ','BJ','BT','BO','BA','BA','BW','BR','VG','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CO','KM','CG','CD','CR','HR','CY','CZ','DK','DJ','DO','EC','EG','SV','GQ','ER','EE','ET','FJ','FI','GA','GM','GE','GH','GR','GL','GT','GN','GY','HT','HN','HU','IS','IN','ID','ID','IR','IQ','IE','IM','IL','IT','CI','JM','JO','KZ','KE','KW','KG','LA','LV','LB','LS','LR','LY','LT','LU','MK','MG','MW','MY','MV','ML','MT','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NP','NL','NZ','NI','NE','NG','KP','NO','OM','PK','PA','PY','PE','PH','PT','PR','QA','RE','RO','RU','RW','SM','SA','SN','RS','SL','SK','SI','SO','ZA','ES','LK','SD','SR','SZ','SE','CH','SY','TJ','TZ','TH','TG','TO','TT','TN','TR','TM','VI','UG','UA','AE','AE','UY','UZ','VA','VE','VN','YE','YU','ZR','ZM','ZW','BD','CZ','AD','Chuncheon','Seoul','Osaka','Tokyo','London','Taipei','Taipei','LosAngeles','SanJose','SiliconValley','Michigan','Mumbai','Frankfurt','Zurich','Moscow','Reunion','PL','GU','VA','LI','CW','SC','AQ',"河北","山西","辽宁","吉林","黑龙江","江苏","浙江","安徽","福建","江西","山东","河南","湖北","湖南","广东","海南","四川","贵州","云南","陕西","甘肃","青海","内蒙古","广西","西藏","宁夏","新疆","北京","天津","上海","重庆"];
const cn=['香港','澳门','台湾','日本','韩国','新加坡','狮城','美国','英国','法国','德国','澳大利亚','澳洲','迪拜','阿富汗','阿尔巴尼亚','阿尔及利亚','安哥拉','阿根廷','亚美尼亚','奥地利','阿塞拜疆','巴林','孟加拉国','白俄罗斯','比利时','伯利兹','贝宁','不丹','玻利维亚','波斯尼亚和黑塞哥维那','波黑共和国','博茨瓦纳','巴西','英属维京群岛','文莱','保加利亚','布基纳法索','布隆迪','柬埔寨','喀麦隆','加拿大','佛得角','开曼群岛','中非共和国','乍得','智利','哥伦比亚','科摩罗','刚果(布)','刚果(金)','哥斯达黎加','克罗地亚','塞浦路斯','捷克共和国','丹麦','吉布提','多米尼加共和国','厄瓜多尔','埃及','萨尔瓦多','赤道几内亚','厄立特里亚','爱沙尼亚','埃塞俄比亚','斐济','芬兰','加蓬','冈比亚','格鲁吉亚','加纳','希腊','格陵兰','危地马拉','几内亚','圭亚那','海地','洪都拉斯','匈牙利','冰岛','印度','印度尼西亚','印尼','伊朗','伊拉克','爱尔兰','马恩岛','以色列','意大利','科特迪瓦','牙买加','约旦','哈萨克斯坦','肯尼亚','科威特','吉尔吉斯斯坦','老挝','拉脱维亚','黎巴嫩','莱索托','利比里亚','利比亚','立陶宛','卢森堡','马其顿','马达加斯加','马拉维','马来','马尔代夫','马里','马耳他','毛利塔尼亚','毛里求斯','墨西哥','摩尔多瓦','摩纳哥','蒙古','黑山共和国','摩洛哥','莫桑比克','缅甸','纳米比亚','尼泊尔','荷兰','新西兰','尼加拉瓜','尼日尔','尼日利亚','朝鲜','挪威','阿曼','巴基斯坦','巴拿马','巴拉圭','秘鲁','菲律宾','葡萄牙','波多黎各','卡塔尔','留尼旺','罗马尼亚','俄罗斯','卢旺达','圣马力诺','沙特阿拉伯','塞内加尔','塞尔维亚','塞拉利昂','斯洛伐克','斯洛文尼亚','索马里','南非','西班牙','斯里兰卡','苏丹','苏里南','斯威士兰','瑞典','瑞士','叙利亚','塔吉克斯坦','坦桑尼亚','泰国','多哥','汤加','特立尼达和多巴哥','突尼斯','土耳其','土库曼斯坦','美属维尔京群岛','乌干达','乌克兰','阿拉伯联合酋长国','阿联酋','乌拉圭','乌兹别克斯坦','梵蒂冈城','委内瑞拉','越南','也门','南斯拉夫','扎伊尔','赞比亚','津巴布韦','孟加拉','捷克','安道尔','春川','首尔','大坂','东京','伦敦','台北','新北','洛杉矶','圣何塞','硅谷','密歇根','孟买','法兰克福','苏黎世','莫斯科','留尼汪','波兰','关岛','梵蒂冈','列支敦士登','库拉索','塞舌尔','南极',"河北","山西","辽宁","吉林","黑龙江","江苏","浙江","安徽","福建","江西","山东","河南","湖北","湖南","广东","海南","四川","贵州","云南","陕西","甘肃","青海","内蒙古","广西","西藏","宁夏","新疆","北京","天津","上海","重庆"];
const quan=['HongKong','Macao','Taiwan','Japan','Korea','Singapore','Singapore','UnitedStates','UnitedKingdom','France','Germany','Australia','Australia','Dubai','Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','BosniaandHerzegovina','BosniaandHerzegovina','Botswana','Brazil','BritishVirginIslands','Brunei','Bulgaria','Burkina-faso','Burundi','Cambodia','Cameroon','Canada','CapeVerde','CaymanIslands','CentralAfricanRepublic','Chad','Chile','Colombia','Comoros','Congo-Brazzaville','Congo-Kinshasa','CostaRica','Croatia','Cyprus','CzechRepublic','Denmark','Djibouti','DominicanRepublic','Ecuador','Egypt','EISalvador','EquatorialGuinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','Gabon','Gambia','Georgia','Ghana','Greece','Greenland','Guatemala','Guinea','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Indonesia','Iran','Iraq','Ireland','IsleofMan','Israel','Italy','IvoryCoast','Jamaica','Jordan','Kazakstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar(Burma)','Namibia','Nepal','Netherlands','NewZealand','Nicaragua','Niger','Nigeria','NorthKorea','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Portugal','PuertoRico','Qatar','Reunion','Romania','Russia','Rwanda','SanMarino','SaudiArabia','Senegal','Serbia','SierraLeone','Slovakia','Slovenia','Somalia','SouthAfrica','Spain','SriLanka','Sudan','Suriname','Swaziland','Sweden','Switzerland','Syria','Tajikstan','Tanzania','Thailand','Togo','Tonga','TrinidadandTobago','Tunisia','Turkey','Turkmenistan','U.S.VirginIslands','Uganda','Ukraine','UnitedArabEmirates','UnitedArabEmirates','Uruguay','Uzbekistan','VaticanCity','Venezuela','Vietnam','Yemen','Yugoslavia','Zaire','Zambia','Zimbabwe','Bangladesh','CzechRepublic','Andorra','Chuncheon','Seoul','Osaka','Tokyo','London','Taipei','Taipei','LosAngeles','SanJose','SiliconValley','Michigan','Mumbai','Frankfurt','Zurich','Moscow','Reunion','Poland','Guam','Vatican','Liechtensteins','Curacao','Seychelles','Antarctica',"河北","山西","辽宁","吉林","黑龙江","江苏","浙江","安徽","福建","江西","山东","河南","湖北","湖南","广东","海南","四川","贵州","云南","陕西","甘肃","青海","内蒙古","广西","西藏","宁夏","新疆","北京","天津","上海","重庆"];
const regexArray=[/0\.1(倍|x|×)/i,/0\.2(倍|x|×)/i,/0\.3(倍|x|×)/i,/0\.4(倍|x|×)/i,/0\.5(倍|x|×)/i,/0\.6(倍|x|×)/i,/0\.7(倍|x|×)/i,/0\.8(倍|x|×)/i,/0\.9(倍|x|×)/i,/2(倍|x|×)/i,/3(倍|x|×)/i,/4(倍|x|×)/i,/5(倍|x|×)/i,/6(倍|x|×)/i,/7(倍|x|×)/i,/8(倍|x|×)/i,/9(倍|x|×)/i,/10(倍|x|×)/i,/20(倍|x|×)/i,/30(倍|x|×)/i,/40(倍|x|×)/i,/50(倍|x|×)/i,/²/,/³/,/⁴/,/⁵/,/⁶/,/⁷/,/⁸/,/⁹/,/¹⁰/,/²⁰/,/³⁰/,/⁴⁰/,/⁵⁰/,/IPLC/,/IEPL/,/核心/,/边缘/,/高级/,/标准/,/实验/,/商宽/,/家宽/,/游戏/,/购物/,/专线/,/LB/,];
const valueArray=["0.1×","0.2×","0.3×","0.4×","0.5×","0.6×","0.7×","0.8×","0.9×","2×","3×","4×","5×","6×","7×","8×","9×","10×","20×","30×","40×","50×","2×","3×","4×","5×","6×","7×","8×","9×","10×","20×","30×","40×","50×","IPLC","IEPL","Kern","Edge","Pro","Std","Exp","Biz","Fam","Game","Buy","Zx","LB",];
const specialRegex = [/IPLC|IEPL|Kern|Edge|Pro|Std|Exp|Biz|Fam|Game|Buy|Zx|LB|Game/, /0.\d×/, /\d×/, /\d倍/];

function operator(proxies) {
  const newProxiess = [];
  proxies.forEach((proxy) => {
    if (proxy.name.includes('UK')) {
      proxy = { ...proxy, name: proxy.name.replace('UK', 'GB') };}
    newProxiess.push(proxy);});
  proxies = newProxiess;
  if (inname !== "") { 
    var inputList = getList(inname); 
  } else {
    const regionCounts = proxies.slice(0,10).map(proxy => 
    getRegion(proxy.name)).reduce((counts, region) => {
    counts[region] = (counts[region] || 0) + 1; return counts; }, {});
    const regionEntries = Object.entries(regionCounts);
    regionEntries.sort((a, b) => b[1] - a[1]);
    const regionConst = regionEntries[0][0];
    var inputList = getList(regionConst);
  }
  var outputList = getList($arguments["out"]);
  var countries = inputList.reduce((acc, curr, index) => {
  acc[curr] = [outputList[index], 0];return acc;}, {});
  if (clear) {
  proxies = proxies.filter((item) => !nameclear.test(item.name));}
  if (nx) {proxies = proxies.filter((res) => res.name.match(namenx) ? false : true);}
  if (blnx) {proxies = proxies.filter((res) => res.name.match(nameblnx) ? true : false);}
  const toBeDeleted = [];
  const newProxies = [];
  proxies.forEach((res) => {
  let isMatched = false;
  const resultArray = [jcname];
  for (const elem of Object.keys(countries)) {
    if (res.name.indexOf(elem) !== -1) {
      if (!isMatched) {
      isMatched = true;
      countries[elem][1] += 1;
      if (addflag) {
        resultArray.push(getflag(us[Object.keys(countries).indexOf(elem)]) + ' ' + countries[elem][0]);
      } else {
        resultArray.push(countries[elem][0]);
      }
      if (bl) {
        regexArray.forEach((regex, index) => {
          if (regex.test(res.name)) {
            //resultArray.unshift(valueArray[index]);
            resultArray.splice(2, 0, valueArray[index]);
          }});}
        }}}
    if (isMatched) {
      newProxies.push({...res, name: resultArray.join(" ")});
    } else {
      toBeDeleted.push(res);}
    });
  toBeDeleted.forEach((proxy) => {
    const index = proxies.indexOf(proxy);
    if (index !== -1) {
    proxies.splice(index, 1);}}); 
  proxies = newProxies;
  proxies = jxh(proxies);
  numone && (proxies = oneProxies(proxies));
  bl && (proxies = fampx(proxies));
  return proxies;
}
