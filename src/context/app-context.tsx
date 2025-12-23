
"use client";

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile, Goal, Transaction, FixedExpense, LoggedPayments, Contribution, EmergencyFundEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { format, formatISO, startOfDay, parseISO } from 'date-fns';

interface AppContextType {
  user: User | null | undefined;
  authLoaded: boolean;
  profile: UserProfile | null | undefined; // Allow undefined for initial loading state
  goals: Goal[];
  transactions: Transaction[];
  onboardingComplete: boolean;
  updateProfile: (profile: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  updateGoal: (goalId: string, updatedGoal: Partial<Omit<Goal, 'id'>>) => void;
  getTodaysSpending: () => number;
  logout: () => void;
  deleteAccount: () => void;
  updateTransaction: (transactionId: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'date'>>) => void;
  deleteTransaction: (transactionId: string) => void;
  getTotalGoalContributions: () => number;
  contributeToGoal: (goalId: string, amount: number) => void;
  getCumulativeDailySavings: () => number;
  toggleFixedExpenseLoggedStatus: (expenseId: string) => void;
  isFixedExpenseLoggedForCurrentMonth: (expenseId: string) => boolean;
  getLoggedPaymentCount: (expenseId: string) => number;
  updateEmergencyFund: (action: 'deposit' | 'withdraw', amount: number, notes?: string) => void;
  setEmergencyFundTarget: (target: number) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const KART_I_QUO_PREFIX = 'kart-i-quo-';
const PROFILE_KEY = `${KART_I_QUO_PREFIX}profile`;
const GOALS_KEY = `${KART_I_QUO_PREFIX}goals`;
const TRANSACTIONS_KEY = `${KART_I_QUO_PREFIX}transactions`;
const LOGGED_PAYMENTS_KEY = `${KART_I_QUO_PREFIX}logged-payments`;

const calculateBudget = (income: number, fixedExpenses: { amount: number }[]): Pick<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'> => {
    const needs = fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Apply 50/30/20 rule based on total income
    const wants = income * 0.3;
    const savings = income * 0.2;
    const daily = wants > 0 ? wants / 30 : 0;

    return {
        monthlyNeeds: needs,
        monthlyWants: wants,
        monthlySavings: savings,
        dailySpendingLimit: daily,
    };
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined); // Start as undefined
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loggedPayments, setLoggedPayments] = useState<LoggedPayments>({});
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('Auth state changed:', currentUser ? `User ${currentUser.uid} logged in` : 'No user');
        setUser(currentUser);
        if (currentUser) {
            try {
                // Load profile from Firestore
                const userProfile = await FirestoreService.getProfile(currentUser.uid);
                if (userProfile) {
                    const budget = calculateBudget(userProfile.income, userProfile.fixedExpenses);
                    const updatedProfile = {
                        ...userProfile,
                        ...budget,
                        emergencyFund: userProfile.emergencyFund || { target: 0, current: 0, history: [] }
                    };
                    setProfile(updatedProfile);
                    setOnboardingComplete(!!updatedProfile.role);
                } else {
                    setProfile(null);
                }

                // Load goals from Firestore
                const userGoals = await FirestoreService.getGoals(currentUser.uid);
                setGoals(userGoals || []);

                // Load transactions from Firestore
                const userTransactions = await FirestoreService.getTransactions(currentUser.uid);
                setTransactions(userTransactions || []);

                // Keep logged payments in localStorage for performance
                const storedLoggedPayments = localStorage.getItem(LOGGED_PAYMENTS_KEY);
                setLoggedPayments(storedLoggedPayments ? JSON.parse(storedLoggedPayments) : {});

            } catch (error) {
                console.error("Failed to load data from localStorage", error);
                setProfile(null);
            }
        } else {
            // User is signed out, clear data
            setProfile(null);
            setGoals([]);
            setTransactions([]);
            setLoggedPayments({});
            setOnboardingComplete(false);
        }
    // Mark that auth state has been determined at least once
    setAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const persistState = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to persist ${key} to localStorage`, error);
    }
  };

  const updateProfile = async (newProfileData: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => {
    if (!user) return;

    try {
      // Prepare base profile data
      const income = newProfileData.income ?? profile?.income ?? 0;
      const fixedExpenses = newProfileData.fixedExpenses?.map(exp => ({
          id: exp.id || crypto.randomUUID(),
          name: exp.name || '',
          amount: exp.amount || 0,
          category: exp.category || 'Other',
          timelineMonths: exp.timelineMonths,
          startDate: (exp.timelineMonths && !exp.startDate) ? formatISO(new Date()) : exp.startDate || formatISO(new Date())
      })) ?? profile?.fixedExpenses ?? [];
      
      const budget = calculateBudget(income, fixedExpenses);

      // Create a complete profile object with all required fields
      const updatedProfile: UserProfile = {
          role: newProfileData.role || profile?.role || '',
          name: newProfileData.name || profile?.name || '',
          income,
          fixedExpenses,
          ...budget,
          emergencyFund: {
            target: newProfileData.emergencyFund?.target ?? profile?.emergencyFund?.target ?? 0,
            current: newProfileData.emergencyFund?.current ?? profile?.emergencyFund?.current ?? 0,
            history: newProfileData.emergencyFund?.history ?? profile?.emergencyFund?.history ?? []
          }
      };
      
      // Debug log before saving
      console.log('About to save profile:', JSON.stringify(updatedProfile, null, 2));
      
      await FirestoreService.updateProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
      setOnboardingComplete(true);

      console.log('Profile saved successfully');
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => {
    if (!user) return;

    try {
      const newGoal: Goal = {
        ...goalData,
        id: crypto.randomUUID(),
        currentAmount: 0,
        startDate: goalData.timelineMonths ? formatISO(new Date()) : undefined,
        contributions: [],
      };

      await FirestoreService.saveGoal(user.uid, newGoal);
      setGoals(prev => [...prev, newGoal]);

      toast({
        title: 'Goal Added!',
        description: `You're now saving for "${newGoal.name}".`,
      });
    } catch (error) {
      console.error("Failed to add goal:", error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive"
      });
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    if (!user) return;

    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        date: formatISO(new Date()),
      };

      await FirestoreService.saveTransaction(user.uid, newTransaction);
      setTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: "Success",
        description: "Transaction added successfully"
      });
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  const updateGoal = (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => {
    const newGoals = goals.map(g => 
        g.id === goalId ? { ...g, ...updatedData, startDate: (g.timelineMonths && !g.startDate) ? formatISO(new Date()) : g.startDate } : g
    );
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
    toast({
        title: 'Goal Updated',
        description: 'Your goal has been successfully updated.',
    });
  };
  
  const updateTransaction = async (transactionId: string, updatedData: Partial<Omit<Transaction, 'id' | 'date'>>) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) throw new Error("Transaction not found");

      const updatedTransaction = {
        ...transaction,
        ...updatedData
      };

      await FirestoreService.saveTransaction(user.uid, updatedTransaction);
      setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t));

      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;

    try {
      await FirestoreService.deleteTransaction(user.uid, transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const getTodaysSpending = () => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(t => t.date.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalGoalContributions = () => {
    return goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
  }

  const getCumulativeDailySavings = () => {
    if (!profile || transactions.length === 0) {
      return 0;
    }

    const spendingByDay = transactions
      .reduce((acc, t) => {
        const day = startOfDay(parseISO(t.date)).toISOString();
        if (!acc[day]) {
          acc[day] = 0;
        }
        acc[day] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
    
    const today = startOfDay(new Date()).toISOString();

    let cumulativeSavings = 0;
    for (const day in spendingByDay) {
      if (day !== today) {
        const spending = spendingByDay[day];
        const saving = profile.dailySpendingLimit - spending;
        if (saving > 0) {
            cumulativeSavings += saving;
        }
      }
    }

    return cumulativeSavings;
  };

  const contributeToGoal = (goalId: string, amount: number) => {
    const newContribution: Contribution = {
        amount,
        date: new Date().toISOString(),
    };

    const newGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newCurrentAmount = goal.currentAmount + amount;
        return { 
            ...goal, 
            currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount,
            contributions: [newContribution, ...(goal.contributions || [])],
         };
      }
      return goal;
    });
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
    toast({
      title: 'Contribution Successful!',
      description: `You've added ₹${amount.toFixed(2)} to your goal.`,
    });
  };

  const isFixedExpenseLoggedForCurrentMonth = (expenseId: string) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    return loggedPayments[expenseId]?.includes(currentMonthKey) || false;
  };
  
  const getLoggedPaymentCount = (expenseId: string) => {
    return loggedPayments[expenseId]?.length || 0;
  };

  const toggleFixedExpenseLoggedStatus = (expenseId: string) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const existingLogs = loggedPayments[expenseId] || [];
    const isLogged = existingLogs.includes(currentMonthKey);
    
    let newLogs;
    if (isLogged) {
      newLogs = existingLogs.filter(month => month !== currentMonthKey);
      toast({ title: 'Expense marked as unpaid.' });
    } else {
      newLogs = [...existingLogs, currentMonthKey];
      toast({ title: 'Expense marked as paid.' });
    }

    const updatedLoggedPayments = {
      ...loggedPayments,
      [expenseId]: newLogs,
    };
    
    setLoggedPayments(updatedLoggedPayments);
    persistState(LOGGED_PAYMENTS_KEY, updatedLoggedPayments);
  };

  const updateEmergencyFund = (action: 'deposit' | 'withdraw', amount: number, notes?: string) => {
    if (!profile) return;

    const newEntry: EmergencyFundEntry = {
        id: Date.now().toString(),
        amount,
        date: new Date().toISOString(),
        type: action === 'deposit' ? 'deposit' : 'withdrawal',
        notes,
    };

    const newCurrent = action === 'deposit' 
        ? profile.emergencyFund.current + amount 
        : profile.emergencyFund.current - amount;

    const updatedProfile: UserProfile = {
        ...profile,
        emergencyFund: {
            ...profile.emergencyFund,
            current: newCurrent < 0 ? 0 : newCurrent,
            history: [newEntry, ...profile.emergencyFund.history],
        },
    };

    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);
    toast({
        title: `Fund ${action === 'deposit' ? 'Added' : 'Withdrawn'}`,
        description: `₹${amount.toFixed(2)} has been ${action === 'deposit' ? 'added to' : 'withdrawn from'} your emergency fund.`,
    });
  };

  const setEmergencyFundTarget = (target: number) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
        ...profile,
        emergencyFund: {
            ...profile.emergencyFund,
            target,
        },
    };
    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);
     toast({
        title: `Target Updated`,
        description: `Your new emergency fund target is ₹${target.toFixed(2)}.`,
    });
  };


  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
       console.error("Logout failed", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
       })
    }
  };

  const deleteAccount = async () => {
    try {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(GOALS_KEY);
        localStorage.removeItem(TRANSACTIONS_KEY);
        localStorage.removeItem(LOGGED_PAYMENTS_KEY);

        if (auth.currentUser) {
          await signOut(auth);
        }

        toast({
            title: "Account Deleted",
            description: "Your account and all data have been successfully deleted.",
        });

        router.push('/signup');
    } catch (error) {
        console.error("Account deletion failed", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while deleting your account. Please try again.",
        });
    }
  };

  const value: AppContextType = {
    user,
    authLoaded,
    profile,
    goals,
    transactions,
    onboardingComplete,
    updateProfile,
    addGoal,
    addTransaction,
    updateGoal,
    getTodaysSpending,
    logout,
    deleteAccount,
    updateTransaction,
    deleteTransaction,
    getTotalGoalContributions,
    contributeToGoal,
    getCumulativeDailySavings,
    toggleFixedExpenseLoggedStatus,
    isFixedExpenseLoggedForCurrentMonth,
    getLoggedPaymentCount,
    updateEmergencyFund,
    setEmergencyFundTarget,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
