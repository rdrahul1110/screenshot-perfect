import { createContext,useContext,useState,type ReactNode } from "react";
import type { Theme } from "./mascot";
export type Expense = { id:string;title:string;amount:number;group:string;paidBy:string;shares:Record<string,number>;source:"manual"|"voice"|"scan";category:string;date:string;deleted?:boolean;settled?:boolean;currency:string };
export type Group = {name:string;emoji:string;members:string[];currency:string; imported?:boolean};
const initial: Expense[] = [
 {id:"1",title:"Food",amount:280,group:"amit",paidBy:"You",shares:{You:140,amit:140},source:"manual",category:"Food",date:"Today",currency:"INR"},
 {id:"2",title:"Expense",amount:100,group:"roadtrip",paidBy:"You",shares:{You:100},source:"voice",category:"Other",date:"Today",settled:true,currency:"INR"},
 {id:"3",title:"Panner",amount:100,group:"Rahul",paidBy:"You",shares:{You:50,Rahul:50},source:"manual",category:"Food",date:"Today",currency:"INR"},
 {id:"4",title:"Coffee",amount:60,group:"amit",paidBy:"You",shares:{You:30,amit:30},source:"manual",category:"Food",date:"Yesterday",deleted:true,currency:"INR"}
];
function useStoreValue() {
 const [theme,setTheme]=useState<Theme>("soot"); const [expenses,setExpenses]=useState(initial); const [friends,setFriends]=useState(["amit","Rahul","Sam"]);
 const [groups,setGroups]=useState<Group[]>([{name:"roadtrip",emoji:"🚗",members:["You"],currency:"INR"},{name:"Just me",emoji:"☁️",members:["You"],currency:"INR"}]);
 const [profile,setProfile]=useState({name:"Rahul",email:"sbn5nf297g@privaterelay.appleid.com"}); const [currency,setCurrency]=useState("INR"); const [notifications,setNotifications]=useState(true);
 const [importBalances,setImportBalances]=useState<Record<string,number>>({});
 const debts:Record<string,number>={...importBalances};
 for(const expense of expenses.filter(e=>!e.deleted&&!e.settled&&e.currency==="INR")) {
   if(expense.paidBy==="You") for(const [person,share] of Object.entries(expense.shares)) {if(person!=="You") debts[person]=(debts[person]||0)+share;}
   else debts[expense.paidBy]=(debts[expense.paidBy]||0)-(expense.shares.You||0);
 }
 const balance=Object.values(debts).reduce((a,b)=>a+b,0);
 return {theme,setTheme,expenses,setExpenses,friends,setFriends,groups,setGroups,profile,setProfile,currency,setCurrency,notifications,setNotifications,debts,balance,importBalances,setImportBalances};
}
const Store=createContext<ReturnType<typeof useStoreValue>|null>(null);
export function SettlProvider({children}:{children:ReactNode}) {const value=useStoreValue();return <Store.Provider value={value}>{children}</Store.Provider>;}
export function useSettl() {const state=useContext(Store);if(!state)throw new Error("Settl provider required");return state;}