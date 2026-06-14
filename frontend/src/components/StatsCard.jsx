import React from 'react'
export default function StatsCard({title,value}){
  return <div style={{border:'1px solid #eee', padding:12}}><strong>{title}</strong><div>{value}</div></div>
}
