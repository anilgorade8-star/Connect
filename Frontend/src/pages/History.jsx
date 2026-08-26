import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/auth-context";
import { useNavigate } from "react-router-dom";
import Card from '@mui/material/Card'

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext)

    const [meeting, setMeeting] = useState([])

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeeting(Array.isArray(history) ? history : [])
            } catch {

            }
        }
        fetchHistory()
    }, [])
    
    return (
        <><div>
            {meeting.map((e, index) => {
                return (
                    <Card key={e?._id || e?.meeting_code || index} variant="outlined">
                        {e?.meeting_code || e?.code || e || "Meeting"}
                    </Card>
                )
            })}
        </div>
        </>
    )
}
