import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';

const SYNC_INTERVAL = 15000; // Check for updates every 15s
const DEBOUNCE_DELAY = 5000; // Wait 5s after last change before auto-exporting

// Configs (copied from LeadsPage for data transformation)
const STATUS_CONFIG: Record<string, { label: string }> = {
    'new': { label: 'Новая' },
    'in_progress': { label: 'В работе' },
    'decision': { label: 'Принимают решение' },
    'negotiation': { label: 'Переговоры' },
    'deal': { label: 'Сделка' },
    'reject': { label: 'Отказ' },
};

const OFFER_CONFIG: Record<string, { label: string }> = {
    'model': { label: 'Модель' },
    'agent': { label: 'Агент' },
    'chatter': { label: 'Чаттер' },
    'operator': { label: 'Оператор' },
};

export const useGoogleSync = () => {
    const { 
        leads, counters, days, monthNotes, googleSheetUrl, lastModified,
        xp, settings,
        setFullState 
    } = useStore();

    const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [lastSyncedTime, setLastSyncedTime] = useState<number>(0);
    const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

    const timeoutRef = useRef<any>(null);
    const hasInitialImportRun = useRef(false);

    // --- EXPORT LOGIC ---
    const handleSync = useCallback(async (isAuto = false) => {
        if (!googleSheetUrl) return;
        if (isAuto) setSyncStatus('loading');
        else setSyncStatus('loading');

        try {
            const exportData = {
                type: 'sync_up',
                lastModified: lastModified, // Send local timestamp
                xp,
                settings,
                leads: leads.map(l => ({
                    id: l.id,
                    name: l.name,
                    status: STATUS_CONFIG[l.status]?.label || l.status,
                    offer: l.offer ? OFFER_CONFIG[l.offer]?.label : '',
                    link: l.link || '',
                    notes: l.notes || '',
                    date: l.firstContactDate ? format(parseISO(l.firstContactDate), 'yyyy-MM-dd HH:mm') : '',
                    source: counters.find(c => c.id === l.sourceCounterId)?.name || 'Manual',
                    history: l.history.map(h => `${format(parseISO(h.timestamp), 'dd.MM HH:mm')} - ${h.action}`).join('; ')
                })),
                counters: counters.map(c => ({
                    id: c.id,
                    name: c.name,
                    value: c.value,
                    type: c.type,
                    color: c.color
                })),
                calendar: Object.entries(days).map(([date, data]) => ({
                    date,
                    status: data.status,
                    note: data.note || '',
                    todos: data.todos ? JSON.stringify(data.todos) : '',
                    blocks: data.blocks ? JSON.stringify(data.blocks) : ''
                })),
                monthNotes: Object.entries(monthNotes).map(([month, data]) => ({
                    month,
                    note: typeof data === 'string' ? data : data.note || '',
                    todos: typeof data !== 'string' && data.todos ? JSON.stringify(data.todos) : '',
                    blocks: typeof data !== 'string' && data.blocks ? JSON.stringify(data.blocks) : ''
                }))
            };

                    await fetch(googleSheetUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            });

            setSyncStatus('success');
            setLastSyncedTime(Date.now());
            setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            setSyncStatus('error');
        }
    }, [googleSheetUrl, leads, counters, days, monthNotes, xp, settings, lastModified]);

    // --- IMPORT LOGIC ---
    const handleImport = useCallback(async (isAuto = false) => {
        if (!googleSheetUrl) return;
        if (!isAuto) setImportStatus('loading');

        try {
            const response = await fetch(`${googleSheetUrl}?action=get`);
            const data = await response.json();

            // Check timestamps if auto-syncing
            const remoteTime = data.lastModified || 0;
            
            // If auto-syncing and local is newer/same, skip import
            const isLocalEmpty = leads.length === 0 && Object.keys(days).length === 0 && counters.length <= 1;
            
            if (isAuto && !isLocalEmpty && lastModified >= remoteTime && remoteTime > 0) {
                return; 
            }

            // Reverse Mappings
            const reverseStatusMap = Object.entries(STATUS_CONFIG).reduce((acc, [k, v]) => ({ ...acc, [v.label]: k }), {} as any);
            const reverseOfferMap = Object.entries(OFFER_CONFIG).reduce((acc, [k, v]) => ({ ...acc, [v.label]: k }), {} as any);

            const importedLeads = (data.leads || []).map((l: any) => ({
                id: l.id || l.ID,
                name: l.name || l['Имя'],
                status: reverseStatusMap[l.status || l['Статус']] || 'new',
                offer: reverseOfferMap[l.offer || l['Оффер']] || undefined,
                link: l.link || l['Ссылка'],
                notes: l.notes || l['Заметки'],
                firstContactDate: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
                history: [], 
                isWork: true,
                createdAt: Date.now()
            }));

            const importedCounters = (data.counters || []).map((c: any) => ({
                id: c.id || c.ID,
                name: c.name || c.Name,
                value: Number(c.value || c.Value),
                type: c.type || c.Type,
                color: c.color || c.Color
            }));

            const importedDays = (data.calendar || []).reduce((acc: any, d: any) => {
                acc[d.date || d.Date] = {
                    status: d.status || d.Status,
                    note: d.note || d.Note,
                    todos: d.todos ? JSON.parse(d.todos) : undefined,
                    blocks: d.blocks ? JSON.parse(d.blocks) : undefined
                };
                return acc;
            }, {});

            const importedMonthNotes = (data.monthNotes || []).reduce((acc: any, m: any) => {
                acc[m.month] = {
                    note: m.note,
                    todos: m.todos ? JSON.parse(m.todos) : undefined,
                    blocks: m.blocks ? JSON.parse(m.blocks) : undefined
                };
                return acc;
            }, {});

            if (importedLeads.length > 0 || importedCounters.length > 0 || Object.keys(importedDays).length > 0 || Object.keys(importedMonthNotes).length > 0) {
                setFullState({
                    leads: importedLeads.length ? importedLeads : leads,
                    counters: importedCounters.length ? importedCounters : counters,
                    days: importedDays,
                    monthNotes: importedMonthNotes,
                    xp: data.xp || xp,
                    settings: data.settings || settings,
                    lastModified: remoteTime || Date.now() 
                });
                setImportStatus('success');
                setTimeout(() => setImportStatus('idle'), 3000);
            }
        } catch (error) {
            console.error('Import failed:', error);
            setImportStatus('error');
        }
    }, [googleSheetUrl, lastModified, setFullState, leads, counters, days, xp, settings]);

    // --- AUTO SYNC EFFECTS ---

    // 1. Auto-Export on Change (Debounced)
    useEffect(() => {
        if (!isAutoSyncEnabled || !googleSheetUrl) return;

        // Skip if we just synced
        if (Date.now() - lastSyncedTime < 1000) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            console.log('Auto-exporting...');
            handleSync(true);
        }, DEBOUNCE_DELAY);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [leads, counters, days, monthNotes, isAutoSyncEnabled, googleSheetUrl, handleSync]);

    // 2. Auto-Import Interval
    useEffect(() => {
        if (!isAutoSyncEnabled) {
            hasInitialImportRun.current = false;
            return;
        }
        if (!googleSheetUrl) return;

        // Immediate check on mount/enable (if idle)
        if (!hasInitialImportRun.current && syncStatus === 'idle') {
            handleImport(true);
            hasInitialImportRun.current = true;
        }

        const interval = setInterval(() => {
            // Only import if we are not currently exporting (simple lock)
            if (syncStatus === 'idle') {
                console.log('Auto-import check...');
                handleImport(true);
            }
        }, SYNC_INTERVAL);

        return () => clearInterval(interval);
    }, [isAutoSyncEnabled, googleSheetUrl, handleImport, syncStatus]);

    return {
        syncStatus,
        importStatus,
        handleSync: () => handleSync(false),
        handleImport: () => handleImport(false),
        isAutoSyncEnabled,
        setIsAutoSyncEnabled
    };
};
