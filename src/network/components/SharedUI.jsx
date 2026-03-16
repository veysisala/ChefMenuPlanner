// Shared UI components for Chef Network tabs
import { useState } from "react";
import { C } from "../../constants.js";
import { CHEF_BADGES } from "../lib/networkConstants.js";

// Section header
export function SH(props) {
  return <div style={{fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:10,fontFamily:"'Playfair Display',serif",display:"flex",alignItems:"center",gap:8}}>
    {props.emoji&&<span>{props.emoji}</span>}
    {props.label}
    {props.count!=null&&<span style={{fontSize:11,color:C.muted,fontWeight:400}}>({props.count})</span>}
  </div>;
}

// Avatar
export function Avatar(props) {
  var s = props.size || 40;
  if (props.url) {
    return <img src={props.url} alt="" style={{width:s,height:s,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)"}} />;
  }
  return <div style={{width:s,height:s,borderRadius:"50%",background:"linear-gradient(135deg,"+C.gold+","+C.orange+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:s*0.45,fontWeight:700,color:"#fff",border:"2px solid var(--border)"}}>
    {(props.name || "?").charAt(0).toUpperCase()}
  </div>;
}

// Badge list
export function BadgeList(props) {
  if (!props.badges || props.badges.length === 0) return null;
  return <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
    {props.badges.map(function(bId) {
      var b = CHEF_BADGES.find(function(x) { return x.id === bId; });
      if (!b) return null;
      return <span key={bId} title={b.label} style={{fontSize:props.small?10:12,padding:props.small?"1px 5px":"2px 8px",borderRadius:50,background:b.color+"18",color:b.color,border:"1px solid "+b.color+"30"}}>{b.emoji} {!props.small&&b.label}</span>;
    })}
  </div>;
}

// Star rating display/input
export function Stars(props) {
  var val = props.value || 0;
  return <div style={{display:"flex",gap:2}}>
    {[1,2,3,4,5].map(function(i) {
      var filled = i <= val;
      return <span key={i} onClick={props.onChange ? function() { props.onChange(i); } : undefined}
        style={{fontSize:props.size||16,cursor:props.onChange?"pointer":"default",color:filled?C.gold:"var(--border)",transition:"color 0.15s"}}>
        {filled?"★":"☆"}
      </span>;
    })}
  </div>;
}

// Chip/tag selector
export function ChipSelect(props) {
  var selected = props.selected || [];
  var multi = props.multi !== false;
  return <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
    {props.options.map(function(opt) {
      var active = multi ? selected.includes(opt.id) : selected === opt.id;
      return <button key={opt.id} onClick={function() {
        if (multi) {
          var next = active ? selected.filter(function(x) { return x !== opt.id; }) : selected.concat([opt.id]);
          props.onChange(next);
        } else {
          props.onChange(active ? "" : opt.id);
        }
      }} style={{padding:"6px 12px",borderRadius:50,border:"1px solid "+(active?C.gold:"var(--border)"),background:active?"rgba(212,168,67,0.12)":"var(--card)",color:active?C.goldL:C.muted,fontSize:12,fontWeight:active?600:400,transition:"all 0.15s"}}>
        {opt.emoji&&<span style={{marginRight:4}}>{opt.emoji}</span>}{opt.label}
      </button>;
    })}
  </div>;
}

// Input field
export function Field(props) {
  return <div style={{marginBottom:props.mb||12}}>
    {props.label&&<label style={{display:"block",fontSize:11,color:C.muted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>{props.label}</label>}
    {props.multiline
      ? <textarea value={props.value||""} onChange={function(e){props.onChange(e.target.value);}} placeholder={props.placeholder} rows={props.rows||3}
          style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:13,resize:"vertical"}} />
      : <input value={props.value||""} onChange={function(e){props.onChange(e.target.value);}} placeholder={props.placeholder} type={props.type||"text"}
          style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:13}} />
    }
  </div>;
}

// Primary button
export function Btn(props) {
  return <button onClick={props.onClick} disabled={props.disabled} style={{
    padding:props.small?"8px 14px":"12px 20px",
    borderRadius:12,
    background:props.variant==="outline"?"transparent":props.variant==="danger"?C.red:props.bg||C.gold,
    color:props.variant==="outline"?C.gold:props.variant==="danger"?"#fff":"#000",
    border:props.variant==="outline"?"1.5px solid "+C.gold:"none",
    fontSize:props.small?12:13,fontWeight:700,
    opacity:props.disabled?0.5:1,
    cursor:props.disabled?"not-allowed":"pointer",
    width:props.full?"100%":undefined,
    transition:"all 0.15s",
  }}>{props.loading?<Spinner size={14} />:props.children}</button>;
}

// Spinner
export function Spinner(props) {
  var s = props.size || 20;
  return <div style={{width:s,height:s,border:"2px solid var(--border)",borderTopColor:props.color||C.gold,borderRadius:"50%",animation:"spin 0.6s linear infinite",display:"inline-block"}} />;
}

// Empty state
export function Empty(props) {
  return <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
    <div style={{fontSize:40,marginBottom:12}}>{props.emoji||"📭"}</div>
    <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{props.title||"Henüz içerik yok"}</div>
    {props.desc&&<div style={{fontSize:12,opacity:0.7}}>{props.desc}</div>}
    {props.action&&<div style={{marginTop:14}}>{props.action}</div>}
  </div>;
}

// Tab bar (sub-tabs within a main tab)
export function SubTabs(props) {
  return <div style={{display:"flex",gap:2,overflowX:"auto",padding:"0 0 12px",marginBottom:12,borderBottom:"1px solid var(--border)",scrollbarWidth:"none"}}>
    {props.tabs.map(function(t) {
      var active = props.active === t.id;
      return <button key={t.id} onClick={function() { props.onChange(t.id); }} style={{
        flex:"0 0 auto",padding:"8px 14px",borderRadius:10,border:"1.5px solid "+(active?C.gold:"transparent"),
        background:active?"rgba(212,168,67,0.1)":"transparent",color:active?C.goldL:C.muted,
        fontSize:12,fontWeight:active?700:400,whiteSpace:"nowrap",transition:"all 0.15s"
      }}>{t.emoji} {t.label}{t.count!=null&&<span style={{marginLeft:4,fontSize:10,opacity:0.7}}>({t.count})</span>}</button>;
    })}
  </div>;
}

// Card wrapper
export function Card(props) {
  return <div onClick={props.onClick} style={Object.assign({
    padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",
    borderRadius:14,marginBottom:8,cursor:props.onClick?"pointer":"default",
    transition:"border-color 0.15s"
  }, props.style||{})}>
    {props.children}
  </div>;
}

// Modal overlay
export function Modal(props) {
  if (!props.open) return null;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:701,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget&&props.onClose)props.onClose();}}>
    <div className="up" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:22,maxWidth:props.wide?560:420,width:"100%",maxHeight:"85vh",overflowY:"auto"}} onClick={function(e){e.stopPropagation();}}>
      {props.title&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{props.title}</div>
        {props.onClose&&<button onClick={props.onClose} style={{fontSize:18,color:C.muted,background:"transparent",border:"none",cursor:"pointer"}}>✕</button>}
      </div>}
      {props.children}
    </div>
  </div>;
}

// Time ago helper
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  var now = Date.now();
  var d = new Date(dateStr).getTime();
  var diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "az önce";
  if (diff < 3600) return Math.floor(diff / 60) + " dk";
  if (diff < 86400) return Math.floor(diff / 3600) + " sa";
  if (diff < 604800) return Math.floor(diff / 86400) + " gün";
  if (diff < 2592000) return Math.floor(diff / 604800) + " hf";
  return Math.floor(diff / 2592000) + " ay";
}
