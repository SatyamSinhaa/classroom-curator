import { useState } from 'react';
import { Plus, GripVertical, Calendar, Save, Calculator } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { HexColorPicker } from 'react-colorful';
import { yearPlansApi } from '../api/yearPlansApi';
import YearCalendar from '../components/YearCalendar';
import 'react-datepicker/dist/react-datepicker.css';

const YearPlan = () => {
  const [formData, setFormData] = useState({
    title: 'Grade 5 Math 2025-26',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2026-05-31'),
    classDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dailyMinutes: 60,
    holidays: [],
    units: [
      { title: 'Algebra', estimatedHours: 20, color: '#ff6b6b' },
      { title: 'Geometry', estimatedHours: 15, color: '#4ecdc4' },
      { title: 'Statistics', estimatedHours: 10, color: '#45b7d1' }
    ]
  });

  const [calculatedPlan, setCalculatedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(null);

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleClassDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      classDays: prev.classDays.includes(day)
        ? prev.classDays.filter(d => d !== day)
        : [...prev.classDays, day]
    }));
  };

  const addUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [...prev.units, { title: '', estimatedHours: 10, color: '#3174ad' }]
    }));
  };

  const updateUnit = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map((unit, i) =>
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const removeUnit = (index) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const moveUnit = (fromIndex, toIndex) => {
    setFormData(prev => {
      const newUnits = [...prev.units];
      const [moved] = newUnits.splice(fromIndex, 1);
      newUnits.splice(toIndex, 0, moved);
      return { ...prev, units: newUnits };
    });
  };

  const calculateSchedule = async () => {
    setLoading(true);
    try {
      const requestData = {
        title: formData.title,
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        class_days: formData.classDays,
        daily_minutes: formData.dailyMinutes,
        holidays: formData.holidays.map(date => date.toISOString().split('T')[0]),
        auto_fetch_holidays: true,
        units: formData.units.map(unit => ({
          title: unit.title,
          estimated_hours: unit.estimatedHours,
          color: unit.color
        }))
      };

      const result = await yearPlansApi.calculate(requestData);
      setCalculatedPlan(result);
    } catch (error) {
      alert('Error calculating schedule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!calculatedPlan) return;

    setLoading(true);
    try {
      const requestData = {
        title: formData.title,
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        class_days: formData.classDays,
        daily_minutes: formData.dailyMinutes,
        holidays: formData.holidays.map(date => date.toISOString().split('T')[0]),
        units: formData.units.map(unit => ({
          title: unit.title,
          estimated_hours: unit.estimatedHours,
          color: unit.color
        }))
      };

      const result = await yearPlansApi.create(requestData);
      alert('Year plan saved successfully!');
      console.log('Saved plan:', result);
    } catch (error) {
      alert('Error saving plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Year Planning</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* School Year Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">School Year Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Days
              </label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.classDays.includes(day)}
                      onChange={() => handleClassDayToggle(day)}
                      className="mr-2"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Minutes per Class
              </label>
              <input
                type="number"
                value={formData.dailyMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyMinutes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Holidays
              </label>
              <DatePicker
                selected={null}
                onChange={(date) => {
                  if (date && !formData.holidays.some(d => d.toDateString() === date.toDateString())) {
                    setFormData(prev => ({ ...prev, holidays: [...prev.holidays, date] }));
                  }
                }}
                placeholderText="Click to add holiday"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.holidays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.holidays.map((holiday, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                    >
                      {holiday.toLocaleDateString()}
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          holidays: prev.holidays.filter((_, i) => i !== index)
                        }))}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Curriculum Units */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Curriculum Units</h2>
            <button
              onClick={addUnit}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Unit
            </button>
          </div>

          <div className="space-y-3">
            {formData.units.map((unit, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />

                <input
                  type="text"
                  placeholder="Unit name"
                  value={unit.title}
                  onChange={(e) => updateUnit(index, 'title', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Hours"
                  value={unit.estimatedHours}
                  onChange={(e) => updateUnit(index, 'estimatedHours', parseFloat(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.5"
                />

                <div className="relative">
                  <button
                    onClick={() => setColorPickerOpen(colorPickerOpen === index ? null : index)}
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: unit.color }}
                  />
                  {colorPickerOpen === index && (
                    <div className="absolute z-10 mt-2">
                      <HexColorPicker
                        color={unit.color}
                        onChange={(color) => updateUnit(index, 'color', color)}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeUnit(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {formData.units.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No units added yet. Click "Add Unit" to get started.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={calculateSchedule}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <Calculator className="w-5 h-5 mr-2" />
          {loading ? 'Calculating...' : 'Calculate Schedule'}
        </button>

        {calculatedPlan && (
          <button
            onClick={savePlan}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Plan
          </button>
        )}
      </div>

      {/* Results */}
      {calculatedPlan && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Calculated Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{calculatedPlan.stats.total_school_days}</div>
              <div className="text-sm text-gray-600">School Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{calculatedPlan.stats.total_instructional_hours.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Instructional Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{calculatedPlan.stats.unused_hours.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Unused Hours</div>
            </div>
          </div>

          <div className="space-y-3">
            {calculatedPlan.scheduled_units.map((unit, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: unit.color }}
                  />
                  <span className="font-medium">{unit.title}</span>
                  <span className="text-sm text-gray-600">({unit.estimated_hours}h)</span>
                </div>

                <div className="text-right">
                  {unit.status === 'scheduled' ? (
                    <div>
                      <div className="text-sm font-medium">
                        {unit.calculated_start_date} to {unit.calculated_end_date}
                      </div>
                      <div className="text-xs text-gray-500">{unit.dates.length} days</div>
                    </div>
                  ) : (
                    <span className="text-red-600 font-medium">Overspill - doesn't fit</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Visualization */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Visual Schedule</h3>
            <YearCalendar scheduledUnits={calculatedPlan.scheduled_units} />
          </div>
        </div>
      )}
    </div>
  );
};

export default YearPlan;
