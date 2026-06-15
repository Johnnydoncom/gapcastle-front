"use client";

import React from "react";
import { Control, Controller, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useInsuranceStates,
  useInsuranceBrands,
  useInsuranceColors,
  useInsuranceEngineCapacities,
  useInsuranceLgas,
  useInsuranceModels,
} from "@/hooks/useInsuranceOptions";

interface InsuranceFieldsProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className={error ? "text-destructive" : ""}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function InsuranceFields({ control, watch, setValue }: InsuranceFieldsProps) {
  const selectedState = watch("state");
  const selectedBrand = watch("vehicle_make");

  const { data: states = [], isLoading: loadingStates } = useInsuranceStates();
  const { data: brands = [], isLoading: loadingBrands } = useInsuranceBrands();
  const { data: colors = [], isLoading: loadingColors } = useInsuranceColors();
  const { data: engineCapacities = [], isLoading: loadingCapacities } = useInsuranceEngineCapacities();
  const { data: lgas = [], isLoading: loadingLgas } = useInsuranceLgas(selectedState);
  const { data: models = [], isLoading: loadingModels } = useInsuranceModels(selectedBrand);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Insured Name */}
      <Controller
        name="Insured_Name"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Insured Name (Full Name)" error={fieldState.error?.message}>
            <Input {...field} placeholder="e.g. John Doe" />
          </FieldWrapper>
        )}
      />

      {/* Email */}
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Email Address" error={fieldState.error?.message}>
            <Input {...field} type="email" placeholder="email@example.com" />
          </FieldWrapper>
        )}
      />

      {/* Plate Number */}
      <Controller
        name="Plate_Number"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Plate Number" error={fieldState.error?.message}>
            <Input
              {...field}
              placeholder="e.g. AAA123AB"
              onChange={(e) => {
                field.onChange(e);
                // billersCode must equal Plate_Number per VTPass docs
                setValue("identifier", e.target.value);
              }}
            />
          </FieldWrapper>
        )}
      />

      {/* Chassis Number */}
      <Controller
        name="Chasis_Number"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Chassis Number" error={fieldState.error?.message}>
            <Input {...field} placeholder="Vehicle chassis / VIN number" />
          </FieldWrapper>
        )}
      />

      {/* Year of Make */}
      <Controller
        name="YearofMake"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Year of Manufacture" error={fieldState.error?.message}>
            <Input {...field} type="number" placeholder={`${new Date().getFullYear()}`} min={1960} max={new Date().getFullYear()} />
          </FieldWrapper>
        )}
      />

      {/* Engine Capacity */}
      <Controller
        name="engine_capacity"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Engine Capacity" error={fieldState.error?.message}>
            {loadingCapacities ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select engine capacity" />
                </SelectTrigger>
                <SelectContent>
                  {engineCapacities.map((cap: any) => (
                    <SelectItem key={cap.CapacityCode} value={cap.CapacityCode}>
                      {cap.CapacityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        )}
      />

      {/* Vehicle Brand / Make */}
      <Controller
        name="vehicle_make"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Vehicle Make (Brand)" error={fieldState.error?.message}>
            {loadingBrands ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue("vehicle_model", ""); // reset model on brand change
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand: any) => (
                    <SelectItem key={brand.VehicleMakeCode} value={brand.VehicleMakeCode}>
                      {brand.VehicleMakeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        )}
      />

      {/* Vehicle Model — cascades from Brand */}
      <Controller
        name="vehicle_model"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Vehicle Model" error={fieldState.error?.message}>
            {!selectedBrand ? (
              <p className="text-sm text-muted-foreground">Select a brand first</p>
            ) : loadingModels ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
              </div>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.VehicleModelCode} value={model.VehicleModelCode}>
                      {model.VehicleModelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        )}
      />

      {/* Vehicle Colour */}
      <Controller
        name="vehicle_color"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Vehicle Colour" error={fieldState.error?.message}>
            {loadingColors ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle colour" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color: any) => (
                    <SelectItem key={color.ColourCode} value={color.ColourCode}>
                      {color.ColourName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        )}
      />

      {/* State */}
      <Controller
        name="state"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="State" error={fieldState.error?.message}>
            {loadingStates ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue("lga", ""); // reset LGA on state change
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state: any) => (
                    <SelectItem key={state.StateCode} value={state.StateCode}>
                      {state.StateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        )}
      />

      {/* LGA — cascades from State */}
      <Controller
        name="lga"
        control={control}
        render={({ field, fieldState }) => (
          <FieldWrapper label="Local Government Area (LGA)" error={fieldState.error?.message}>
            {!selectedState ? (
              <p className="text-sm text-muted-foreground">Select a state first</p>
            ) : loadingLgas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading LGAs…
              </div>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {lgas.map((lga: any) => (
                    <SelectItem key={lga.LGACode} value={lga.LGACode}>
                      {lga.LGAName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        )}
      />
    </div>
  );
}
