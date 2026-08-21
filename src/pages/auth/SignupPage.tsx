import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Checkbox } from '../../components/common/Checkbox';
import { useTheme } from '../../context/ThemeContext';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  companyEmail?: string;
  companyDescription?: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (hasCompany) {
      if (!companyName.trim()) newErrors.companyName = 'Company name is required';
      if (companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail))
        newErrors.companyEmail = 'Invalid email format';
    }

    return newErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">TaskManager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            placeholder="John Doe"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Checkbox
            label="Have a company?"
            checked={hasCompany}
            onChange={e => setHasCompany(e.target.checked)}
          />

          {hasCompany && (
            <div className="space-y-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
              <Input
                label="Company Name"
                type="text"
                placeholder="Acme Inc."
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                error={errors.companyName}
              />
              <Input
                label="Company Email"
                type="email"
                placeholder="company@example.com"
                value={companyEmail}
                onChange={e => setCompanyEmail(e.target.value)}
                error={errors.companyEmail}
              />
              <Input
                label="Company Description"
                type="text"
                placeholder="Brief description of your company"
                value={companyDescription}
                onChange={e => setCompanyDescription(e.target.value)}
                error={errors.companyDescription}
              />
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
