import React, { useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Input } from 'alurkerja-ui';
import { AlurkerjaMfeInputProps } from './type/AlurkerjaType';

export default function IzinWithFileFormView({ props, alurkerjaParams }: AlurkerjaMfeInputProps) {
    const { control, watch, setValue } = props.form;
    const [fileError, setFileError] = useState<string>('');

    // Watch values for calculations
    const tanggalMulai = watch('tanggalMulai');
    const tanggalSelesai = watch('tanggalSelesai');
    const pilihJam = watch('pilihJam') || false;
    const jamMulai = watch('jamMulai');
    const jamSelesai = watch('jamSelesai');
    const uploadedFile = watch('uploadedFile');

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
                const selectedDate = new Date(tanggalMulai);
                // Compare only year, month, and day
                isToday = selectedDate.getFullYear() === today.getFullYear() &&
                         selectedDate.getMonth() === today.getMonth() &&
                         selectedDate.getDate() === today.getDate();
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
        if (pilihJam && jamMulai && !jamMulaiOptions.includes(jamMulai)) {
            setValue('jamMulai', '');
            setValue('jamSelesai', '');
        }
    }, [tanggalMulai, jamMulaiOptions, jamMulai, pilihJam, setValue]);

    // Reset jamSelesai if current selection is not available in new options
    useEffect(() => {
        if (pilihJam && jamSelesai && !jamSelesaiOptions.includes(jamSelesai)) {
            setValue('jamSelesai', '');
        }
    }, [jamMulai, jamSelesaiOptions, jamSelesai, pilihJam, setValue]);

    // Calculate duration
    useEffect(() => {
        if (!pilihJam) {
            // Calculate based on dates
            if (tanggalMulai && tanggalSelesai) {
                const start = new Date(tanggalMulai);
                const end = new Date(tanggalSelesai);

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
            // Calculate based on time
            if (jamMulai && jamSelesai && tanggalMulai && tanggalSelesai) {
                const start = new Date(tanggalMulai);
                const end = new Date(tanggalSelesai);

                const [startHour, startMin] = jamMulai.split(':').map(Number);
                const [endHour, endMin] = jamSelesai.split(':').map(Number);

                start.setHours(startHour, startMin, 0, 0);
                end.setHours(endHour, endMin, 0, 0);

                const diffTime = Math.abs(end.getTime() - start.getTime());
                let diffHours = diffTime / (1000 * 60 * 60); // Convert to hours

                // Subtract 1 hour for lunch break (istirahat)
                diffHours = Math.max(0, diffHours - 1);

                setValue('durasiJam', Math.round(diffHours * 10) / 10); // Round to 1 decimal
                setValue('durasiHari', 0);
            } else {
                setValue('durasiJam', 0);
                setValue('durasiHari', 0);
            }
        }
    }, [tanggalMulai, tanggalSelesai, pilihJam, jamMulai, jamSelesai, setValue]);

    // Reset jam fields when switch changes and auto-set tanggalSelesai
    useEffect(() => {
        if (!pilihJam) {
            setValue('jamMulai', '');
            setValue('jamSelesai', '');
        } else {
            // When Pilih Jam = Ya, set tanggalSelesai = tanggalMulai
            if (tanggalMulai) {
                setValue('tanggalSelesai', tanggalMulai);
            }
        }
    }, [pilihJam, tanggalMulai, setValue]);

    // File validation function
    const validateFile = (file: File): string | null => {
        // Allowed file types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ];

        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.doc', '.docx'];

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            // Check by extension if MIME type check fails
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!allowedExtensions.includes(fileExtension)) {
                return 'Tipe file tidak valid. Hanya file PDF, gambar (JPG, PNG, GIF, WEBP), dan dokumen Word (DOC, DOCX) yang diperbolehkan.';
            }
        }

        // Optional: Check file size (e.g., max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return 'Ukuran file terlalu besar. Maksimal 5MB.';
        }

        return null;
    };

    // Handle file change
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: any) => {
        const file = event.target.files?.[0];

        if (!file) {
            setFileError('');
            onChange(null);
            return;
        }

        const error = validateFile(file);
        if (error) {
            setFileError(error);
            event.target.value = ''; // Reset input
            onChange(null);
        } else {
            setFileError('');
            onChange(file);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Tanggal Mulai dan Selesai */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
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
                                    style={{ fontSize: '0.875rem', width: '100%' }}
                                    min={minDate}
                                    {...field}
                                />
                                {fieldState.error && (
                                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{fieldState.error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Hide Tanggal Selesai when Pilih Jam = Ya */}
                {!pilihJam && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Tanggal Selesai Izin <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Controller
                            name="tanggalSelesai"
                            control={control}
                            rules={{ required: !pilihJam ? 'Tanggal selesai wajib diisi' : false }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <Input
                                        type="date"
                                        style={{ fontSize: '0.875rem', width: '100%' }}
                                        min={tanggalMulai || minDate}
                                        {...field}
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Pilih Jam</label>
                <Controller
                    name="pilihJam"
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
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                                {field.value ? 'Ya' : 'Tidak'}
                            </span>
                        </div>
                    )}
                />
            </div>

            {/* Jam Mulai dan Selesai - Only show when pilihJam is true */}
            {pilihJam && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Jam Mulai Izin <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Controller
                            name="jamMulai"
                            control={control}
                            rules={{ required: pilihJam ? 'Jam mulai wajib diisi' : false }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <select
                                        key={`jam-mulai-${jamMulaiOptions.length}-${jamMulaiOptions[0] || 'empty'}`}
                                        style={{
                                            fontSize: '0.875rem',
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
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Jam Selesai Izin <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <Controller
                            name="jamSelesai"
                            control={control}
                            rules={{ required: pilihJam ? 'Jam selesai wajib diisi' : false }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <select
                                        key={`jam-selesai-${jamSelesaiOptions.length}-${jamSelesaiOptions[0] || 'empty'}`}
                                        style={{
                                            fontSize: '0.875rem',
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Durasi Izin (Jam)</label>
                    <Controller
                        name="durasiJam"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <Input
                                    type="number"
                                    style={{ fontSize: '0.875rem', width: '100%', backgroundColor: '#f9fafb' }}
                                    disabled
                                    {...field}
                                    value={field.value || 0}
                                />
                                {pilihJam && (
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        * Sudah dikurangi 1 jam istirahat
                                    </p>
                                )}
                            </div>
                        )}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Durasi Izin (Hari)</label>
                    <Controller
                        name="durasiHari"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                style={{ fontSize: '0.875rem', width: '100%', backgroundColor: '#f9fafb' }}
                                disabled
                                {...field}
                                value={field.value || 0}
                            />
                        )}
                    />
                </div>
            </div>

            {/* File Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Upload Dokumen Pendukung <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Controller
                    name="uploadedFile"
                    control={control}
                    rules={{
                        required: 'File dokumen wajib diupload',
                        validate: (value) => {
                            if (!value) return 'File dokumen wajib diupload';
                            if (value instanceof File) {
                                const error = validateFile(value);
                                return error || true;
                            }
                            return true;
                        }
                    }}
                    render={({ field: { onChange, value, ...field }, fieldState }) => (
                        <div>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={(e) => handleFileChange(e, onChange)}
                                    style={{
                                        fontSize: '0.875rem',
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                    {...field}
                                />
                                {uploadedFile && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#059669',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <span>✓</span>
                                        <span>File terpilih: {uploadedFile.name}</span>
                                        <span style={{ color: '#6b7280' }}>
                                            ({(uploadedFile.size / 1024).toFixed(2)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Format yang diperbolehkan: PDF, gambar (JPG, PNG, GIF, WEBP), dan dokumen Word (DOC, DOCX). Maksimal 5MB.
                            </p>
                            {(fieldState.error || fileError) && (
                                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                                    {fieldState.error?.message || fileError}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

