import React from 'react'
export default function MemberTable({members=[]}){
  return (
    <table><thead><tr><th>Name</th><th>Phone</th></tr></thead>
    <tbody>{members.map(m=> <tr key={m._id}><td>{m.name}</td><td>{m.phone}</td></tr>)}</tbody></table>
  )
}
