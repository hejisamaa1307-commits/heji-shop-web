"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/app/lib/supabase";
import ProgressLoading from "@/components/features/ProgressLoading";

interface AddAccountAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Hàm tạo tên tài khoản ngẫu nhiên theo format fat_xxxxxx
function generateRandomAccountName(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  const length = 6;
  let randomString = '';
  for (let i = 0; i < length; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `fat_${randomString}`;
}

export default function AddAccountAlert({ isOpen, onClose, onSuccess }: AddAccountAlertProps) {
  const [priceText, setPriceText] = useState("");
  const [mainAcc, setMainAcc] = useState("");
  const [translatedPriceText, setTranslatedPriceText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [currentStepNumber, setCurrentStepNumber] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(0);

  // Reset form khi đóng
  useEffect(() => {
    if (!isOpen) {
      setPriceText("");
      setMainAcc("");
      setTranslatedPriceText("");
      setFiles([]);
      setPreviews([]);
      setMessage(null);
      setCurrentStep('');
      setProgress(0);
      setCurrentStepNumber(0);
      setTotalSteps(0);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, append: boolean = false) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      // Nếu append = true thì thêm vào danh sách hiện có, nếu không thì reset
      const currentFiles = append ? files : [];
      const newFiles = [...currentFiles, ...selectedFiles];
      setFiles(newFiles);

      // Tạo array với độ dài cố định để giữ thứ tự chính xác
      // Sử dụng map với index để đảm bảo thứ tự được giữ đúng (quan trọng cho mobile)
      const previewPromises: Promise<{ index: number; preview: string }>[] = selectedFiles.map((file, index) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ index, preview: reader.result as string });
          };
          reader.onerror = (error) => {
            console.error(`Error reading file ${index}:`, error);
            // Nếu lỗi, vẫn trả về với preview rỗng để giữ thứ tự
            resolve({ index, preview: '' });
          };
          reader.readAsDataURL(file);
        });
      });

      // Sử dụng Promise.all để đảm bảo thứ tự được giữ đúng (quan trọng cho mobile)
      Promise.all(previewPromises).then((previewResults) => {
        // Sắp xếp lại theo index gốc để đảm bảo thứ tự đúng (phòng trường hợp Promise resolve không theo thứ tự)
        previewResults.sort((a, b) => a.index - b.index);

        // Lấy preview theo thứ tự đã sắp xếp
        const sortedPreviews = previewResults.map(result => result.preview).filter(preview => preview !== '');

        // Đảm bảo số lượng preview khớp với số lượng file
        if (sortedPreviews.length !== selectedFiles.length) {
          console.warn(`Preview count mismatch: ${sortedPreviews.length} previews for ${selectedFiles.length} files`);
        }

        // Nếu append thì thêm vào cuối, nếu không thì thay thế
        if (append) {
          setPreviews([...previews, ...sortedPreviews]);
        } else {
          setPreviews(sortedPreviews);
        }
      }).catch((error) => {
        console.error('Error loading previews:', error);
        setMessage({ type: "error", text: "Lỗi khi tải preview ảnh!" });
        setTimeout(() => setMessage(null), 3000);
      });
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeAllImages = () => {
    setFiles([]);
    setPreviews([]);
  };

  // Parse giá từ textarea: format "52m - 54m - 50m" (mỗi dòng tối đa 3 giá)
  const parsePrices = (priceText: string): string[] => {
    const lines = priceText.trim().split('\n').filter(line => line.trim());
    const prices: string[] = [];

    lines.forEach(line => {
      // Tách các giá trong dòng bằng " - " hoặc " -" hoặc "- "
      const linePrices = line.split(/\s*-\s*/).filter(p => p.trim());
      linePrices.forEach(price => {
        const trimmed = price.trim();
        if (trimmed) {
          prices.push(trimmed);
        }
      });
    });

    return prices;
  };

  // Hàm đếm số lượng giá
  const getPriceCount = (): number => {
    if (!priceText.trim()) return 0;
    return parsePrices(priceText).length;
  };

  const priceCount = getPriceCount();
  const imageCount = files.length;
  const isMatch = priceCount === imageCount && priceCount > 0;

  // Convert giá từ format "52m", "31m5" sang số
  const convertPriceToNumber = (priceStr: string): number | null => {
    const trimmed = priceStr.trim().toLowerCase();
    // Xử lý format: 52m, 31m5, 14m5, 7m2, 3m6, 4m5, 38m, 11m, 10m5
    // m = triệu (1,000,000)
    // 31m5 = 31.5 triệu (5 = 0.5 triệu)
    if (trimmed.includes('m')) {
      const parts = trimmed.split('m');
      const millions = parseFloat(parts[0]) || 0;
      // Phần sau "m" là phần thập phân: 5 = 0.5 triệu
      const decimalPart = parts[1] ? parseFloat(parts[1]) / 10 : 0;
      return (millions + decimalPart) * 1000000;
    }
    // Xử lý format khác: k, số thường
    const cleaned = trimmed.replace(/[kK,.\s]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      return num;
    }
    return null;
  };

  // Parse giá từ text với nhiều format (ví dụ: "3m2", "2m5", "48", "26.5", "7m", "7.8")
  const parsePriceFromText = (text: string): number | null => {
    const trimmed = text.trim().toLowerCase();
    // Bỏ qua text không phải số (như "bay", "gct dư", v.v.)
    if (/^[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]+$/i.test(trimmed)) {
      return null;
    }
    // Format có "m": 3m2 = 3.2 triệu, 2m5 = 2.5 triệu, 7m = 7 triệu
    if (trimmed.includes('m')) {
      const parts = trimmed.split('m');
      const millions = parseFloat(parts[0]) || 0;
      const decimalPart = parts[1] ? parseFloat(parts[1]) / 10 : 0;
      return (millions + decimalPart) * 1000000;
    }
    // Format số thập phân hoặc số nguyên: 48 = 48 triệu, 26.5 = 26.5 triệu, 7.8 = 7.8 triệu
    const cleaned = trimmed.replace(/[,\s]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      // Coi như triệu nếu không có "m"
      return num * 1000000;
    }
    return null;
  };

  // Function để đôn giá theo rule
  const donGia = (price: number): number => {
    const priceInMillion = price / 1000000;
    if (priceInMillion < 3) {
      return price + 200000; // +200k
    } else if (priceInMillion < 5) {
      return price + 300000; // +300k
    } else if (priceInMillion < 7) {
      return price + 400000; // +400k
    } else if (priceInMillion < 10) {
      return price + 500000; // +500k
    } else if (priceInMillion < 20) {
      return price + 600000; // +600k
    } else if (priceInMillion < 50) {
      return price + 1000000; // +1m
    } else if (priceInMillion < 100) {
      return price + 2000000; // +2m
    } else {
      return price + 5000000; // +5m
    }
  };

  // Function để format giá thành string
  const formatPriceToString = (price: number): string => {
    const priceInMillion = price / 1000000;
    const wholePart = Math.floor(priceInMillion);
    const decimalPart = priceInMillion - wholePart;
    if (decimalPart > 0) {
      const roundedDecimal = Math.round(decimalPart * 10) / 10;
      if (roundedDecimal === 0.5) {
        return `${wholePart}m5`;
      } else {
        return `${wholePart}m${Math.round(roundedDecimal * 10)}`;
      }
    }
    return `${wholePart}m`;
  };

  // Function chính để translate giá
  const translatePrices = (inputText: string): string => {
    const allPrices: number[] = [];
    // Parse tất cả giá từ input (bất kể format: có dấu "-", khoảng trắng, hoặc xuống dòng)
    // Ví dụ: "16m  - 13m -52m" hoặc "16m         13m\n52m"
    // Normalize: thay tất cả dấu "-" (có hoặc không có space) thành space
    let normalizedText = inputText.replace(/\s*-\s*/g, ' '); // Thay " - " hoặc "-" thành space
    normalizedText = normalizedText.replace(/\s+/g, ' '); // Thay nhiều space thành 1 space
    const allParts = normalizedText.split(/[\s\n]+/).filter(part => part.trim());
    // Parse từng phần thành giá
    allParts.forEach(part => {
      // Loại bỏ dấu "-" ở đầu nếu có (ví dụ: "-52m" -> "52m")
      const cleanedPart = part.replace(/^-+/, '').trim();
      const price = parsePriceFromText(cleanedPart);
      if (price !== null && price > 0) {
        allPrices.push(price);
      }
    });
    if (allPrices.length === 0) {
      throw new Error('Không tìm thấy giá nào trong text! Vui lòng kiểm tra lại format (ví dụ: 3m2, 2m5, 48, 26.5)');
    }
    // Apply đôn giá
    const donGiaPrices = allPrices.map(price => donGia(price));
    // Format lại thành string với format: giá1 - giá2 - giá3 (mỗi hàng đúng 3 giá)
    // Kéo giá lên để đủ 3 giá mỗi hàng
    const formattedPrices: string[] = [];
    for (let i = 0; i < donGiaPrices.length; i += 3) {
      const linePrices = donGiaPrices.slice(i, i + 3);
      const formattedLine = linePrices.map(formatPriceToString);
      // Đảm bảo luôn có đủ 3 giá mỗi hàng (nếu thiếu thì thêm chuỗi rỗng)
      while (formattedLine.length < 3) {
        formattedLine.push('');
      }
      // Join bằng " - " và loại bỏ dấu "-" thừa ở cuối
      const joined = formattedLine.join(' - ').replace(/\s*-\s*$/, '');
      formattedPrices.push(joined);
    }
    return formattedPrices.join('\n');
  };

  // Handler để translate
  const handleTranslatePrices = () => {
    if (!translatedPriceText.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập text cần translate!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    try {
      const translated = translatePrices(translatedPriceText);
      setPriceText(translated);
      setMessage({ type: "success", text: `Đã translate và đôn giá thành công! Tìm thấy ${translated.split('\n').reduce((acc, line) => acc + line.split(' - ').length, 0)} giá.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Lỗi khi translate giá!" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      setMessage({ type: "error", text: "Vui lòng chọn ít nhất 1 ảnh!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Parse giá từ textarea
    const priceStrings = parsePrices(priceText);

    if (priceStrings.length === 0) {
      setMessage({ type: "error", text: "Vui lòng nhập giá cho tài khoản!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (priceStrings.length < files.length) {
      setMessage({ type: "error", text: `Bạn đã chọn ${files.length} ảnh nhưng chỉ nhập ${priceStrings.length} giá. Vui lòng nhập đủ giá cho tất cả ảnh!` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Convert tất cả giá sang số
    const prices: number[] = [];
    for (let i = 0; i < files.length; i++) {
      const priceNum = convertPriceToNumber(priceStrings[i]);
      if (priceNum === null || priceNum <= 0) {
        setMessage({ type: "error", text: `Giá thứ ${i + 1} không hợp lệ: "${priceStrings[i]}"` });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      prices.push(priceNum);
    }

    setLoading(true);
    setMessage(null);
    setCurrentStep('');
    setProgress(0);
    setTotalSteps(2); // Upload và Create
    setCurrentStepNumber(1);

    try {
      // Get current user session (cache một lần)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setMessage({ type: "error", text: "Bạn cần đăng nhập để thêm tài khoản!" });
        setTimeout(() => setMessage(null), 3000);
        setLoading(false);
        return;
      }

      const mainAccValue = mainAcc.trim() || null;
      const description = "Hỗ trợ ae góp chỉ từ 30% giá acc ( Ấn chức năng 'Tính góp' để tính góp ).";
      const userId = session.user.id; // Cache user ID

      // Bước 1: Upload tất cả ảnh song song (parallel) với progress tracking
      setCurrentStep(`Đang upload ${files.length} ảnh...`);
      setMessage({ type: "success", text: `Đang upload ${files.length} ảnh...` });
      setProgress(5);

      const uploadResults = await Promise.allSettled(
        files.map(async (file, index) => {
          try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadResult.success) {
              throw new Error(uploadResult.error || 'Upload failed');
            }

            // Update progress
            setProgress(5 + ((index + 1) / files.length) * 45); // 5-50%

            return { index, url: uploadResult.url, success: true };
          } catch (error) {
            console.error(`Upload ảnh ${index + 1} thất bại:`, error);
            return {
              index,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      // Process upload results
      const uploadResultsProcessed = uploadResults.map((result, idx) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { index: idx, success: false, error: result.reason?.message || 'Upload failed' };
        }
      });


      const successfulUploads = uploadResultsProcessed.filter((r): r is { index: number; url: string; success: true } =>
        r.success && 'url' in r && typeof r.url === 'string'
      );
      const failedUploads = uploadResultsProcessed.filter(r => !r.success);

      if (successfulUploads.length === 0) {
        setProgress(0);
        setCurrentStep('');
        setMessage({ type: "error", text: "Tất cả ảnh upload đều thất bại!" });
        setTimeout(() => setMessage(null), 3000);
        setLoading(false);
        return;
      }

      setProgress(50);
      setCurrentStepNumber(2);

      // Bước 2: Tạo accounts song song (parallel) với progress tracking
      setCurrentStep(`Đang tạo ${successfulUploads.length} tài khoản...`);
      setMessage({
        type: "success",
        text: `Đang tạo ${successfulUploads.length} tài khoản...`
      });

      const createResults = await Promise.allSettled(
        successfulUploads.map(async (uploadResult, idx) => {
          const { index, url } = uploadResult;
          const price = prices[index];

          try {
            const accountTitle = generateRandomAccountName();
            const accountData = {
              title: accountTitle,
              price: price.toString(),
              description: description,
              image_url: url,
              main_acc: mainAccValue,
              owner: userId,
            };

            // Insert account
            const { data: insertedAccount, error: insertError } = await supabase
              .from("accounts")
              .insert([accountData])
              .select()
              .single();

            if (insertError) {
              console.error(`Lỗi insert account ${index + 1}:`, insertError);
              throw insertError;
            }

            if (!insertedAccount?.id) {
              throw new Error('Account created but no ID returned');
            }

            // Insert ảnh vào account_images table với error handling tốt hơn
            const { error: imageInsertError } = await supabase
              .from("account_images")
              .insert([{
                acc_id: insertedAccount.id,
                image_url: url,
              }]);

            if (imageInsertError) {
              console.error(`Lỗi insert account_images ${index + 1}:`, imageInsertError);
              // Không throw error ở đây, vì account đã được tạo thành công
              // Chỉ log để theo dõi
            }

            // Update progress
            setProgress(50 + ((idx + 1) / successfulUploads.length) * 45); // 50-95%

            return { success: true, index, accountId: insertedAccount.id };
          } catch (error) {
            console.error(`Lỗi tạo tài khoản ${index + 1}:`, error);
            return {
              success: false,
              index,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      // Process create results
      const createResultsProcessed = createResults.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { success: false, index: -1, error: result.reason?.message || 'Create failed' };
        }
      });

      setProgress(100);

      // Đếm kết quả
      const successCount = createResultsProcessed.filter(r => r.success).length;
      const errorCount = failedUploads.length + createResultsProcessed.filter(r => !r.success).length;

      if (successCount > 0) {
        setCurrentStep('');
        setProgress(0);
        setMessage({
          type: "success",
          text: `Thêm thành công ${successCount} tài khoản${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}!`
        });
        setTimeout(() => {
          setMessage(null);
          setCurrentStep('');
          setProgress(0);
          setCurrentStepNumber(0);
          onClose();
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setCurrentStep('');
        setProgress(0);
        setMessage({ type: "error", text: `Không thể thêm tài khoản nào! Đã xảy ra ${errorCount} lỗi.` });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      setProgress(0);
      setCurrentStep('');
      setMessage({ type: "error", text: "Đã xảy ra lỗi!" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
      setCurrentStepNumber(0);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto py-8"
      style={{ zIndex: 99999, position: 'fixed' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl mx-2 sm:mx-4 my-2 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black dark:bg-black border-2 border-white/40 shadow-2xl relative p-3 sm:p-6 rounded-lg sm:rounded-2xl">
          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-white hover:text-gray-300 active:text-gray-400 transition-colors bg-black/50 rounded-full hover:bg-black/70 active:bg-black/80 touch-manipulation"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Nội dung Alert */}
          <div className="mt-4">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center" style={{ fontFamily: 'var(--font-nosifer), sans-serif' }}>
              Thêm tài khoản mới
            </h2>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${message.type === "success"
                ? "bg-green-900/30 text-green-300 border border-green-500/50"
                : "bg-red-900/30 text-red-300 border border-red-500/50"
                }`}>
                {message.text}
              </div>
            )}
            {currentStep && loading && (
              <div className="mb-4 p-3 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-500/50">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{currentStep}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Translate giá từ text (tùy chọn)
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <textarea
                    value={translatedPriceText}
                    onChange={(e) => setTranslatedPriceText(e.target.value)}
                    rows={4}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Paste text cần translate ở đây (ví dụ: 3m2, 2m5, BAY - 3m2. Gct dư - 2m...)"
                  />
                  <button
                    type="button"
                    onClick={handleTranslatePrices}
                    className="px-4 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Translate & Đôn giá
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-400 mb-3">
                  Paste text chứa giá (ví dụ: 3m2, 2m5) → Tự động parse và đôn giá theo rule
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Giá (VNĐ) - Mỗi dòng tối đa 3 giá, cách nhau bởi " - "
                </label>
                <div className="relative">
                  <textarea
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs sm:text-sm leading-relaxed"
                    placeholder="52m - 54m - 50m&#10;31m5 - 20m - 17m&#10;14m5 - 12m - 11m"
                  />
                  {/* Note đếm số lượng giá ở góc phải */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${priceCount === 0
                      ? 'bg-gray-700/50 text-gray-400'
                      : isMatch
                        ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                        : 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/50'
                      }`}>
                      {priceCount > 0 ? `${priceCount} giá` : 'Chưa nhập giá'}
                    </span>
                    {priceCount > 0 && imageCount > 0 && (
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${isMatch
                        ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                        : 'bg-red-600/30 text-red-300 border border-red-500/50'
                        }`}>
                        {isMatch ? '✓' : `${imageCount} ảnh`}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-1 leading-relaxed">
                  Ví dụ: 52m = 52 triệu, 31m5 = 31.5 triệu. Mỗi giá tương ứng với 1 ảnh theo thứ tự.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Chủ tài khoản (áp dụng cho tất cả tài khoản)
                </label>
                <input
                  type="text"
                  value={mainAcc}
                  onChange={(e) => setMainAcc(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-white/30 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập chủ tài khoản (sẽ áp dụng cho tất cả)"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Ảnh tài khoản (ít nhất 1 ảnh)
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, files.length > 0)}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm border border-white/30 rounded-lg bg-black/50 text-white file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    title={files.length > 0 ? "Thêm nhiều ảnh vào danh sách hiện có" : "Chọn nhiều ảnh"}
                  />
                  {previews.length > 0 && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, true)}
                      className="px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm border border-white/30 rounded-lg bg-black/50 text-white file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                      title="Thêm 1 ảnh vào danh sách hiện có"
                    />
                  )}
                </div>
                {previews.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-gray-300">Đã chọn {previews.length} ảnh</span>
                      <button
                        type="button"
                        onClick={removeAllImages}
                        className="text-xs sm:text-sm text-red-400 hover:text-red-300 px-2 py-1 rounded active:bg-red-900/20"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-h-40 sm:max-h-48 overflow-y-auto">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-white/20"
                          />
                          {/* Hiển thị số thứ tự */}
                          <div className="absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold z-10 shadow-md">
                            {index + 1}
                          </div>
                          {/* Nút xóa từng ảnh - luôn hiển thị nhưng có opacity */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-6 h-6 sm:w-6 sm:h-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 active:opacity-100 transition-opacity z-10 shadow-md touch-manipulation"
                            title={`Xóa ảnh ${index + 1}`}
                            aria-label={`Xóa ảnh ${index + 1}`}
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 sm:py-2 text-sm sm:text-base border border-white/30 rounded-lg text-white hover:bg-white/10 active:bg-white/20 transition-colors font-medium touch-manipulation"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 sm:py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {loading ? 'Đang thêm...' : `Thêm ${files.length} tài khoản`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return (
      <>
        {loading && progress > 0 && (
          <ProgressLoading
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
            currentStepNumber={currentStepNumber}
          />
        )}
        {createPortal(modalContent, document.body)}
      </>
    );
  }

  return (
    <>
      {loading && progress > 0 && (
        <ProgressLoading
          progress={progress}
          currentStep={currentStep}
          totalSteps={totalSteps}
          currentStepNumber={currentStepNumber}
        />
      )}
      {modalContent}
    </>
  );
}

