import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
export default function DashboardPage() {
    const tasks = useQuery(api.tasks.get);
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {tasks?.map(({ _id, text }) => <div key={_id}>{text}</div>)}
        </div>
    );
}
