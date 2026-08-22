import { useState, useMemo } from 'react';
import { Plus, Edit, UserCheck, UserX, MoreVertical } from 'lucide-react';
import { Table, type Column } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { SearchBox } from '../../components/common/SearchBox';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Dropdown } from '../../components/common/Dropdown';
import { mockUsers, mockProjects, mockRoles } from '../../utils/mockData';
import type { User } from '../../types';
import UserFormModal from './UserFormModal';

const PAGE_SIZE = 5;

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getUserProjects = (userId: string) =>
    mockProjects.filter(p => p.members.some(m => m.userId === userId));

  const getUserRoles = (userId: string) => {
    const roles: string[] = [];
    mockProjects.forEach(p => {
      p.members.forEach(m => {
        if (m.userId === userId) {
          const role = mockRoles.find(r => r.id === m.roleId);
          if (role && !roles.includes(role.name)) roles.push(role.name);
        }
      });
    });
    return roles;
  };

  const enriched = useMemo(() => {
    return users.map(u => ({
      ...u,
      projectCount: getUserProjects(u.id).length,
      roles: getUserRoles(u.id),
    }));
  }, [users]);

  const filtered = useMemo(() => {
    let result = enriched;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (filterValues.status) {
      result = result.filter(u => u.status === filterValues.status);
    }
    result.sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a] ?? '';
      const bVal = b[sortKey as keyof typeof b] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [enriched, search, filterValues, sortKey, sortDirection]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
  };

  const handleSave = (user: Partial<User> & { projectRoles?: Record<string, string> }) => {
    if (editingUser) {
      setUsers(prev =>
        prev.map(u => (u.id === editingUser.id ? { ...u, ...user } : u))
      );
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: user.name ?? '',
        email: user.email ?? '',
        status: user.status ?? 'active',
        createdAt: new Date().toISOString(),
        avatar: `https://i.pravatar.cc/150?u=${user.name}`,
      };
      setUsers(prev => [...prev, newUser]);
    }
    setModalOpen(false);
    setEditingUser(null);
  };

  const columns: Column<(typeof enriched)[number]>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: u => (
        <div className="flex items-center gap-3">
          <Avatar src={u.avatar} name={u.name} size="sm" />
          <span className="font-medium">{u.name}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'projectCount',
      header: 'Projects',
      render: u => <span className="text-slate-600 dark:text-slate-400">{u.projectCount}</span>,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: u => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && <span className="text-slate-400 text-xs">None</span>}
          {u.roles.map(r => (
            <Badge key={r} variant="info">{r}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: u => (
        <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
          {u.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: u =>
        u.lastLogin
          ? new Date(u.lastLogin).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: u => (
        <Dropdown
          trigger={
            <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </button>
          }
          items={[
            {
              label: 'Edit',
              icon: <Edit className="h-4 w-4" />,
              onClick: () => {
                setEditingUser(u);
                setModalOpen(true);
              },
            },
            {
              label: u.status === 'active' ? 'Deactivate' : 'Activate',
              icon: u.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />,
              onClick: () => handleToggleStatus(u.id),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Users</h1>
        <Button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBox
          value={search}
          onChange={v => {
            setSearch(v);
            setCurrentPage(1);
          }}
          placeholder="Search users..."
          className="sm:w-72"
        />
        <FilterPanel
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          values={filterValues}
          onChange={(key, value) => {
            setFilterValues(prev => ({ ...prev, [key]: value }));
            setCurrentPage(1);
          }}
          onClear={() => {
            setFilterValues({});
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <Table
          columns={columns}
          data={paginated}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyMessage="No users found"
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <UserFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSave}
      />
    </div>
  );
}
