import React, { useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { Input } from 'alurkerja-ui';
import { AlurkerjaMfeInputProps } from './type/AlurkerjaType';

export default function IzinFormView({ props, alurkerjaParams }: AlurkerjaMfeInputProps) {
    const { control, watch, setValue } = props.form;

    // Helper function to format date to dd-MM-yyyy
    const formatDateToDDMMYYYY = (date: Date | string): string => {
        const d = typeof date === 'string' ? parseDateFromDDMMYYYY(date) : date;
        if (!d || isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Helper function to parse dd-MM-yyyy to Date
    const parseDateFromDDMMYYYY = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    };

    // Helper function to convert yyyy-MM-dd to dd-MM-yyyy
    const convertYYYYMMDDToDDMMYYYY = (dateStr: string): string => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    };

    // Helper function to convert dd-MM-yyyy to yyyy-MM-dd for input[type="date"]
    const convertDDMMYYYYToYYYYMMDD = (dateStr: string): string => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return '';
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    // Watch values for calculations
    const tanggalMulai = watch('tanggalMulai');
    const tanggalSelesai = watch('tanggalSelesai');
    const customHours = watch('customHours') || false;
    const jamMulai = watch('jamMulai');
    const jamSelesai = watch('jamSelesai');
    const durasiJam = watch('durasiJam') || 0;
    const durasiHari = watch('durasiHari') || 0;

    // Calculate minimum date allowed
    const getMinDate = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // If current time is after 16:30, start from tomorrow
        if (currentHour >= 17 || (currentHour === 16 && currentMinute >= 30)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }

        // Otherwise, start from today
        return now.toISOString().split('T')[0];
    };

    const minDate = getMinDate();

    // Generate time options (08:00 - 17:00, every 30 minutes)
    // useMemo to recalculate when tanggalMulai changes
    const jamMulaiOptions = useMemo(() => {
        const generateTimeOptions = () => {
            const times: string[] = [];
            let currentHour: number;
            let currentMinute: number;

            // Check if selected date is today
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let isToday = false;
            if (tanggalMulai) {
                const selectedDate = parseDateFromDDMMYYYY(tanggalMulai);
                if (selectedDate) {
                    // Compare only year, month, and day
                    isToday = selectedDate.getFullYear() === today.getFullYear() &&
                             selectedDate.getMonth() === today.getMonth() &&
                             selectedDate.getDate() === today.getDate();
                }
            }

            if (isToday) {
                // Start from current time rounded to next 30-minute interval
                const nowHour = now.getHours();
                const nowMinute = now.getMinutes();

                // Round up to next 30-minute interval
                if (nowMinute <= 30) {
                    currentHour = nowHour;
                    currentMinute = 30;
                } else {
                    currentHour = nowHour + 1;
                    currentMinute = 0;
                }

                // If current time is after 17:00 or before 08:00, start from 08:00
                if (currentHour < 8 || currentHour > 17) {
                    currentHour = 8;
                    currentMinute = 0;
                }
            } else {
                // For other dates (past or future), start from 08:00
                currentHour = 8;
                currentMinute = 0;
            }

            while (currentHour <= 17) {
                if (currentHour === 17 && currentMinute > 0) break;
                times.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
                currentMinute += 30;
                if (currentMinute >= 60) {
                    currentMinute = 0;
                    currentHour += 1;
                }
            }
            return times;
        };
        return generateTimeOptions();
    }, [tanggalMulai]); // Re-calculate when tanggalMulai changes

    // Generate jam selesai options based on jam mulai
    const jamSelesaiOptions = useMemo(() => {
        if (!jamMulai) return [];

        const times: string[] = [];
        const startHour = parseInt(jamMulai.split(':')[0]);
        const startMinute = parseInt(jamMulai.split(':')[1]);

        let currentHour = startHour;
        let currentMinute = startMinute === 0 ? 30 : 0;

        if (currentMinute === 0) {
            currentHour += 1;
        }

        while (currentHour <= 17) {
            if (currentHour === 17 && currentMinute > 0) break;
            times.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
            currentMinute += 30;
            if (currentMinute >= 60) {
                currentMinute = 0;
                currentHour += 1;
            }
        }
        return times;
    }, [jamMulai]); // Re-calculate when jamMulai changes

    // Reset jamMulai if current selection is not available in new options
    useEffect(() => {
        if (customHours && jamMulai && !jamMulaiOptions.includes(jamMulai)) {
            setValue('jamMulai', '');
            setValue('jamSelesai', '');
        }
    }, [tanggalMulai, jamMulaiOptions, jamMulai, customHours, setValue]);

    // Reset jamSelesai if current selection is not available in new options
    useEffect(() => {
        if (customHours && jamSelesai && !jamSelesaiOptions.includes(jamSelesai)) {
            setValue('jamSelesai', '');
        }
    }, [jamMulai, jamSelesaiOptions, jamSelesai, customHours, setValue]);

    // Calculate duration
    useEffect(() => {
        if (!customHours) {
            setValue('pilihJam', 'Tidak')
            // Calculate based on dates
            if (tanggalMulai && tanggalSelesai) {
                const start = parseDateFromDDMMYYYY(tanggalMulai);
                const end = parseDateFromDDMMYYYY(tanggalSelesai);

                if (start && end) {
                    // Set time to start of day for accurate day calculation
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);

                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
                    const diffHours = diffDays * 8; // Assuming 8 working hours per day

                    setValue('durasiJam', diffHours);
                    setValue('durasiHari', diffDays);
                } else {
                    setValue('durasiJam', 0);
                    setValue('durasiHari', 0);
                }
            } else {
                setValue('durasiJam', 0);
                setValue('durasiHari', 0);
            }
        } else {
            setValue('pilihJam', 'Ya')
            // Calculate based on time
            if (jamMulai && jamSelesai && tanggalMulai && tanggalSelesai) {
                const start = parseDateFromDDMMYYYY(tanggalMulai);
                const end = parseDateFromDDMMYYYY(tanggalSelesai);

                if (start && end) {
                    const [startHour, startMin] = jamMulai.split(':').map(Number);
                    const [endHour, endMin] = jamSelesai.split(':').map(Number);

                    let breakTime = 1;
                    if (startHour > 12 || endHour <= 12) {
                        breakTime = 0;
                    }
                    if (startHour === 12 && startMin === 30) {
                        breakTime = 0.5;
                    }
                    if (endHour === 12 && endMin === 30) {
                        breakTime = 0.5;
                    }

                    start.setHours(startHour, startMin, 0, 0);
                    end.setHours(endHour, endMin, 0, 0);

                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    let diffHours = diffTime / (1000 * 60 * 60); // Convert to hours

                    // Subtract 1 hour for lunch break (istirahat)
                    diffHours = Math.max(0, diffHours - breakTime);
                    diffHours = Math.round(diffHours * 10) / 10;
                    let diffDays = Math.round((diffHours / 8) * 100) / 100;

                    setValue('durasiJam', diffHours); // Round to 1 decimal
                    setValue('durasiHari', diffDays);
                } else {
                    setValue('durasiJam', 0);
                    setValue('durasiHari', 0);
                }
            } else {
                setValue('durasiJam', 0);
                setValue('durasiHari', 0);
            }
        }
    }, [tanggalMulai, tanggalSelesai, customHours, jamMulai, jamSelesai, setValue]);

    // Reset jam fields when switch changes and auto-set tanggalSelesai
    useEffect(() => {
        if (!customHours) {
            setValue('jamMulai', '');
            setValue('jamSelesai', '');
        } else {
            // When Pilih Jam = Ya, set tanggalSelesai = tanggalMulai
            if (tanggalMulai) {
                setValue('tanggalSelesai', tanggalMulai);
            }
        }
    }, [customHours, tanggalMulai, setValue]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Tanggal Mulai dan Selesai */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Tanggal Mulai Izin <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <Controller
                        name="tanggalMulai"
                        control={control}
                        rules={{ required: 'Tanggal mulai wajib diisi' }}
                        render={({ field, fieldState }) => (
                            <div>
                                <Input
                                    type="date"
                                    style={{ fontSize: '16px', width: '100%' }}
                                    min={minDate}
                                    value={convertDDMMYYYYToYYYYMMDD(field.value || '')}
                                    onChange={(e) => {
                                        const yyyyMMdd = e.target.value;
                                        const ddMMyyyy = convertYYYYMMDDToDDMMYYYY(yyyyMMdd);
                                        field.onChange(ddMMyyyy);
                                    }}
                                />
                                {fieldState.error && (
                                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{fieldState.error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Hide Tanggal Selesai when Pilih Jam = Ya */}
                {!customHours && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Tanggal Selesai Izin <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Controller
                            name="tanggalSelesai"
                            control={control}
                            rules={{ required: !customHours ? 'Tanggal selesai wajib diisi' : false }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <Input
                                        type="date"
                                        style={{ fontSize: '16px', width: '100%' }}
                                        min={convertDDMMYYYYToYYYYMMDD(tanggalMulai || '') || minDate}
                                        value={convertDDMMYYYYToYYYYMMDD(field.value || '')}
                                        onChange={(e) => {
                                            const yyyyMMdd = e.target.value;
                                            const ddMMyyyy = convertYYYYMMDDToDDMMYYYY(yyyyMMdd);
                                            field.onChange(ddMMyyyy);
                                        }}
                                    />
                                    {fieldState.error && (
                                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{fieldState.error.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>

            {/* Switch Pilih Jam */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>Pilih Jam</label>
                <Controller
                    name="customHours"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                style={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    height: '1.5rem',
                                    width: '2.75rem',
                                    alignItems: 'center',
                                    borderRadius: '9999px',
                                    transition: 'background-color 0.2s',
                                    outline: 'none',
                                    backgroundColor: field.value ? '#2563eb' : '#d1d5db',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        height: '1rem',
                                        width: '1rem',
                                        transform: field.value ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                                        borderRadius: '9999px',
                                        backgroundColor: 'white',
                                        transition: 'transform 0.2s'
                                    }}
                                />
                            </button>
                            <span style={{ fontSize: '16px', color: '#374151' }}>
                                {field.value ? 'Ya' : 'Tidak'}
                            </span>
                        </div>
                    )}
                />
            </div>

            {/* Jam Mulai dan Selesai - Only show when customHours is true */}
            {customHours && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Jam Mulai Izin <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Controller
                            name="jamMulai"
                            control={control}
                            rules={{ required: customHours ? 'Jam mulai wajib diisi' : false }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <select
                                        key={`jam-mulai-${jamMulaiOptions.length}-${jamMulaiOptions[0] || 'empty'}`}
                                        style={{
                                            fontSize: '16px',
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            outline: 'none'
                                        }}
                                        {...field}
                                    >
                                        <option value="">Pilih jam mulai</option>
                                        {jamMulaiOptions.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldState.error && (
                                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{fieldState.error.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Jam Selesai Izin <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Controller
                            name="jamSelesai"
                            control={control}
                            rules={{ required: customHours ? 'Jam selesai wajib diisi' : false }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <select
                                        key={`jam-selesai-${jamSelesaiOptions.length}-${jamSelesaiOptions[0] || 'empty'}`}
                                        style={{
                                            fontSize: '16px',
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            outline: 'none'
                                        }}
                                        {...field}
                                        disabled={!jamMulai}
                                    >
                                        <option value="">Pilih jam selesai</option>
                                        {jamSelesaiOptions.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldState.error && (
                                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{fieldState.error.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Durasi Izin (Read-only) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>Durasi Izin (Jam)</label>
                    <Controller
                        name="durasiJam"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <Input
                                    type="number"
                                    style={{ fontSize: '16px', width: '100%', backgroundColor: '#f9fafb' }}
                                    disabled
                                    {...field}
                                    value={field.value || 0}
                                />
                                {customHours && (
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        * Sudah dikurangi 1 jam istirahat
                                    </p>
                                )}
                            </div>
                        )}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', marginBottom: '0.25rem' }}>Durasi Izin (Hari)</label>
                    <Controller
                        name="durasiHari"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                style={{ fontSize: '16px', width: '100%', backgroundColor: '#f9fafb' }}
                                disabled
                                {...field}
                                value={field.value || 0}
                            />
                        )}
                    />
                </div>
            </div>

            {/* Warning when duration is 0 */}
            {durasiJam === 0 && durasiHari === 0 && (tanggalMulai || tanggalSelesai || jamMulai || jamSelesai) && (
                <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg
                        style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b', flexShrink: 0 }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#92400e', margin: 0 }}>
                            Peringatan: Durasi izin tidak valid
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#78350f', margin: '0.25rem 0 0 0' }}>
                            {!customHours
                                ? 'Silakan pilih tanggal mulai dan tanggal selesai yang valid. Tanggal selesai harus sama atau setelah tanggal mulai.'
                                : 'Silakan pilih jam mulai dan jam selesai yang valid. Jam selesai harus setelah jam mulai.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}


