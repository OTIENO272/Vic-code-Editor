 
//  ==============  UTILITIES ==============  


const  $ = s =>document.querySelector(s);
const $$ =s =>Array.from( document.querySelectorAll(s));
const out =$("#output");
const preview = $("#preview");
const STORAGE_KEY = "vic-code-web";

const escapeHtml = s =>
	String(s).replace(/[&<>"]/g, c => ({

		'&':"&amb;",
		'<':"&lt;",
		'>':"&gt;",
		'"':"&quot;",
	}[c]
));

function log(msg, type='info'){
	const color = type ==='error'? 'var(--err)' : type === "warn" ? 'var(--warn)' :'var(--brand)';

    const time =new Date().toLocaleTimeString();

    const line = document.createElement("div");

    line.innerHTML = `<span style='color:${color}'>[${time}]</span> ${escapeHtml(msg)}`;

    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
}
 
function clearOut() {
	out.innerHTML ="";
}

$("#clearOut")?.addEventListener("click", clearOut);

function makeEditor(id, mode){
window.addEventListener("DOMContentLoaded", () => {
  const ed = ace.edit("editor", {
    theme: "ace/theme/dracula",
    mode: "ace/mode/javascript",
    tabSize: 2,
    useSoftTabs: true,
    showPrintMargin: false
  });}
	ed.session.setUserWrapMode(true);

	ed.commands.addCommand({
		name:"run",
		bindKey:{
			win:'Ctrl-Enter',
			mac:'Command-Enter',
			linux:'Ctl-Enter'
		},
		exe(){runWeb(false);}
	});

	ed.commands.addCommand({
		name:"save",
		bindKey:{
			win:"Ctrl-S",
			mac:"Command-S",
			linux:"Ctrl-S"
		},
		exe(){saveProject();}
	});

	return ed;

}

const ed_html = makeEditor("ed_html" ,"ace/mode/html");
const ed_css = makeEditor("ed_css","ace/mode/css");
const ed_js= makeEditor("ed_js","ace/mode/javascript");

const TAB_ORDER =["html", "css","js"];

const wraps = Object.fromEntries($$("#webEditors.editor-wrap").map(w => [w.dataset.pane, w]));

const editors = {
	html:ed_html, 
	css:ed_css,
	js:ed_js
}
function activePane(){
	const t =$("#weTabs.tab.active");
	return t ?t.dataset.pane:"html";
}

function showPane(name){
	TAB_ORDER.forEach(k =>  
		 {
			 if(wraps[k]) 
				{ wraps[k].hidden = (k !== name);

				}})

				$$("$webTabs.tab").forEach(t => {
					const on = t.dataset.pane === name;
					t.classList.toggle("active", on);
					t.setAttribute("aria-selected", on);
					t.tabIndex = on ? 0 :-1;
				});

				requestAnimationFrame(() =>{
					const ed = editors[name];
					if(ed && ed.resize){
						ed.resize(true);
						ed.focus();
					}
				})

}

$("#webTabs")?.addEventListener("click" ,(e) => {
	const btn =e.target.closest(".tab");
	if(!btn){
		return;
	}
	showPane(btn.dataset.pane);
})

$("#webTabs")?.addEventListener("keydown", (e) => {
	const idx = TAB_ORDER.indexOf(activePane());
	if(e.key === "ArrowLeft" || e.key === "ArrowRight"){
		const delta = e.key === "ArrowLeft"? -1: 1;
		showPane(TAB_ORDER[(idx+delta + TAB_ORDER.length)
			% TAB_ORDER.length
		])
	}
})

showPane("html");

function buildwebSrcdoc(withTest = false){
	const html = ed_html.getValue();
	const css = ed_css.getValue();
	const js = ed_js.getValue();
	const test = ($("#testArea" ) ?.value || '').trim();

	return `
	<!DOCTYPE html>

	<html lang="en" dir ="ltr"

			<head>
					<meta charset ="UTF-8">
					<meta name="viewport" content="width=device-width,initial-scale=1.0">
					
					<style>
						${css}\n
					</style>
			
			</head>
			<body>
				${html}

				<script>
					 try{
					 	${js}

						${withTest && tests ? `\n/* tests */ \n${tets}` :''}
					 
					 }
					 catch(e){
						console.error(e);
						
					 }
				<\/script>
			</body>
	</html>

	`;

}

function runWeb(withTest = false){
	preview.srcdoc = buildwebSrcdoc(withTest);
	log(withTest ? "Run with tets" :"Web preview updated");


}

$("#runWeb")?.addEventListener("click" ,() => runWeb(false));
$("#runTests")?.addEventListener("click" ,() => runWeb(true));
$("#openPreview")?.addEventListener("click", () => {
	const src = buildwebSrcdoc(false);

	const w = window.open("about:blank");

	w.document.open();
	w.document.write(src);
	w.document.close();//close the window to prevent resource loss
});

function projectJSON(){
	return {
		version: 1,
		kind: 'web-only',
		assignment:$("#assignment")?.value ||  "",
		test:$("#testArea")?.value || "",
		html:ed_html.getValue(),
		css:ed_css.getValue(),
		js:ed_js.getValue(),
	};
}

function  loadProject(obj){
	try{
		if($("#assignment")) $("#assignment").value =obj.assignment || "";

		if ($("#testArea")) $("#testArea").value = obj.test || "";

		ed_html.setValue(obj.html  || "" , -1);

		ed_css.setValue(obj.css  || "" -1);

		ed_js.setValue(obj.js || "", -1);

		log("Web project loaded.");

	}
	catch(e){
		log("Unable to load project :" + e, "error");

	}
}

function  setDefaultContent (){
	ed_html.setValue(`<!-- html code  section .....-->`-1);
	ed_css.setValue(`/*css code  section */ ` -1);
	ed_js.setValue(`//js code  section` -1);
}

function saveProject(){
	try{
		const data = JSON.stringify(projectJSON(), null ,  2);
		localStorage.setItem(STORAGE_KEY, data);
		const blob = new Blob([data], {type: "application/json"});
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "vic-code.json";
		a.click();//programmatic clicking .....
		log("Saved locally and downloaded  JSON file");
	}
	catch(e){
		log("Unable to save :" + e, "error");
	}
}

$("#saveBtn")?.addEventListener("click" ,saveProject());
$("#loadBtn")?.addEventListener("click" ,() => $("#openFile").click());
$("#openFile")?.addEventListener("change" , async (e) => {
	const f = e.target.files ?.[0] ;
	if(!f){
		return;
	}
	try{
		const obj = JSON.parse(await f.text());
		loadProject(obj);
	}
	catch (err){
		log("Invalid file : " ,"error")
	}
});

try{
	const cache = localStorage.getItem(STORAGE_KEY);
	if(cache){
		loadProject(JSON.parse(cache));
	}else {
		setDefaultContent();
	}

}catch{
	setDefaultContent();
}

log("Ready - Web - only editor");
