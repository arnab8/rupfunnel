import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { optInFormSchema, OptInFormData } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OptInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OptInFormData) => void;
  isSubmitting?: boolean;
}

const OptInPopup: React.FC<OptInPopupProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OptInFormData>({
    resolver: zodResolver(optInFormSchema),
  });

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Get Instant Access to the Training
          </h2>
          <p className="text-muted-foreground">
            Enter your details below to watch the exclusive briefing
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="executive-label">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Full Name"
                className="executive-input"
              />
              {errors.fullName && (
                <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="executive-label">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="Phone"
                className="executive-input"
              />
              {errors.phone && (
                <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="executive-label">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Email"
                className="executive-input"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="jobRole" className="executive-label">
                Mention Your Current Designation <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jobRole"
                {...register('jobRole')}
                placeholder="Mention Your Current Designation"
                className="executive-input"
              />
              {errors.jobRole && (
                <p className="text-destructive text-sm mt-1">{errors.jobRole.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full executive-button mt-6"
            >
              {isSubmitting ? 'Processing...' : 'Click Here to Watch'}
            </Button>
          </form>
      </div>
    </div>
  );
};

export default OptInPopup;
