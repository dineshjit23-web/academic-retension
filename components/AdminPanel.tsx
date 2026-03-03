import React, { useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AdminPanelProps {
    token: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ token }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const resp = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        try {
            const resp = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (resp.ok) fetchUsers();
        } catch (err) {
            console.error('Failed to update role', err);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    if (loading) return <div>Loading Neural Directory...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-black mb-8">System <span className="text-indigo-500">Directory</span></h2>
            <div className="overflow-hidden bg-white/5 border border-white/10 rounded-3xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-black uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Operative</th>
                            <th className="px-6 py-4">Signature Email</th>
                            <th className="px-6 py-4">Authorization Level</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 font-bold">{user.username}</td>
                                <td className="px-6 py-4 text-slate-400">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                            user.role === 'faculty' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-indigo-500/20 text-indigo-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => updateRole(user.id, e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg text-xs font-bold p-1 outline-none"
                                    >
                                        <option value="student">Student</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;
