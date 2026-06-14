import React, { useEffect, useState } from 'react'
import api from '../services/api'
import MemberTable from '../components/MemberTable'

export default function Members(){
  const [members, setMembers] = useState([])
  useEffect(()=>{ api.get('/members').then(r=>setMembers(r.data)).catch(()=>{} ) },[])
  return <div className="container"><h2>Members</h2><MemberTable members={members} /></div>
}
